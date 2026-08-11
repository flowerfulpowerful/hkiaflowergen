// Create a Flower planner — reverse breeding search + layout suggestions

class FlowerPlanSolver {
    constructor(sim) {
        this.sim = sim;
        this.maxPairsPerFlower = 12;
        this.maxPlans = 20;
        this.maxVerifyBudget = 400; // hard stop so effect searches can't freeze the tab
        this.memo = new Map();
        this.pairCache = new Map();
        this.reverseColorMix = null;
        this._terminals = null;
        this._verifyCount = 0;
    }

    /**
     * Planning must evaluate event-flower outcomes even when greenhouse/event
     * toggles are off in the main UI (otherwise Petunia/etc. never appear).
     */
    withPlanningBreedContext(fn) {
        const prevGreenhouse = this.sim.greenhouseMode;
        const prevEvent = this.sim.selectedEvent;
        const prevEffects = this.sim.patternNoSecondaries;
        const originalLog = console.log;
        console.log = () => {};
        try {
            this.sim.greenhouseMode = true;
            return fn();
        } finally {
            this.sim.greenhouseMode = prevGreenhouse;
            this.sim.selectedEvent = prevEvent;
            this.sim.patternNoSecondaries = prevEffects;
            console.log = originalLog;
        }
    }

    /**
     * Layout scoring must use the real Greenhouse toggle so clone odds match in-game:
     * GH single-parent patterned = FallbackPatternCloneChance (20%),
     * outdoor single-parent patterned = PatternedClone (1%),
     * identical pair patterned = PatternedClone (1%) either mode.
     */
    withLayoutBreedContext(fn) {
        const prevEffects = this.sim.patternNoSecondaries;
        const originalLog = console.log;
        console.log = () => {};
        try {
            return fn();
        } finally {
            this.sim.patternNoSecondaries = prevEffects;
            console.log = originalLog;
        }
    }

    /** True when the UI Greenhouse toggle is on. */
    isGreenhouseEnabled() {
        return !!this.sim.greenhouseMode;
    }

    /**
     * In-game patterned clone resets secondary via setDefaultSecondaryColor.
     * Returns the flower that would actually be produced by a successful patterned clone.
     */
    patternedCloneResult(flower) {
        if (!flower) return null;
        if ((flower.pattern || 'None') === 'None') {
            return this.cloneFlower(flower);
        }
        return this.sim.setDefaultSecondaryColor(this.cloneFlower(flower));
    }

    /**
     * Whether planting `source` can produce `target` via the game's clone paths
     * (single-parent or identical-pair simple clone).
     */
    canCloneFlowerToTarget(source, target) {
        if (!source || !target) return false;
        if (source.type !== target.type || source.mainColor !== target.mainColor) {
            return false;
        }
        const srcPat = source.pattern || 'None';
        const tgtPat = target.pattern || 'None';
        const tgtSec = target.secondaryColor || 'None';

        if (tgtPat === 'None') {
            // Solid target: solids clone to themselves; patterned parents also strip to solid
            return tgtSec === 'None';
        }

        // Patterned target: only a successful patterned clone of a matching pattern parent,
        // after secondary reset, can match.
        if (srcPat !== tgtPat) return false;
        const cloned = this.patternedCloneResult(source);
        return this.flowerKey(cloned) === this.flowerKey(target);
    }

    flowerKey(flower) {
        if (!flower) return '';
        return `${flower.type},${flower.mainColor},${flower.pattern},${flower.secondaryColor}`;
    }

    cloneFlower(flower) {
        return this.sim.createFlower(
            flower.type,
            flower.mainColor,
            flower.pattern || 'None',
            flower.secondaryColor || 'None'
        );
    }

    buildReverseColorMix() {
        if (this.reverseColorMix) return this.reverseColorMix;
        const reverse = {};
        const combos = this.sim.color_combinations || {};
        for (const [pairKey, child] of Object.entries(combos)) {
            const parts = pairKey.split(',');
            if (parts.length !== 2) continue;
            const [a, b] = parts;
            if (!reverse[child]) reverse[child] = [];
            reverse[child].push([a, b]);
            reverse[child].push([b, a]);
        }
        this.reverseColorMix = reverse;
        return reverse;
    }

    isValidFlower(flower) {
        if (!flower || !flower.type || !flower.mainColor) return false;
        try {
            return !!this.sim.validateFlowerCombination(flower);
        } catch (e) {
            return false;
        }
    }

    /** Target flower must be plantable on the current plot. */
    canUseType(type) {
        return this.sim.canPlaceFlowerInCurrentPlot(type);
    }

    /**
     * Recipe parents may come from any region (game breeding pairs often cross plots,
     * e.g. Marigold + Happadil for Bubbaluna). Only the CAF *target* is plot-locked.
     */
    canUseParentType(type) {
        return !!(type && this.sim.allFlowerTypes && this.sim.allFlowerTypes.includes(type));
    }

    getFertilizePatternChance() {
        const chance = this.sim.breedSettingsData?.flowerSettings?.FertilizePatternChance;
        return typeof chance === 'number' ? chance : 0.01;
    }

    /**
     * If this flower is exactly what fertilize would produce from a solid of the same
     * type/color (default pattern/effect), return that solid origin.
     */
    getFertilizeSource(flower) {
        if (!flower || flower.pattern === 'None') return null;
        const defPat = this.getDefaultPatternForType(flower.type);
        if (!defPat || defPat === 'None' || flower.pattern !== defPat) return null;

        const expected = this.patterned(flower.type, flower.mainColor, defPat, 'White');
        if (this.flowerKey(expected) !== this.flowerKey(flower)) return null;

        const solid = this.solid(flower.type, flower.mainColor);
        return this.isValidFlower(solid) ? solid : null;
    }

    normalizeTarget(flower) {
        const target = this.cloneFlower(flower);
        if (target.pattern === 'None' || this.sim.getIsEffectPattern(target.pattern)) {
            target.secondaryColor = 'None';
        } else if (!target.secondaryColor || target.secondaryColor === 'None') {
            target.secondaryColor = 'White';
            if (target.secondaryColor === target.mainColor) {
                target.secondaryColor = target.mainColor === 'White' ? 'Warm Pink' : 'White';
            }
        }
        return target;
    }

    getDefaultPatternForType(type) {
        const map = this.sim.flowerDefaultPatterns || {};
        for (const [pattern, flowerTypes] of Object.entries(map)) {
            if (Array.isArray(flowerTypes) && flowerTypes.includes(type)) {
                return pattern;
            }
        }
        return 'None';
    }

    getTerminalFlowers(includeGridFlowers) {
        const terminals = new Map();
        const types = this.sim.allFlowerTypes || [];

        types.forEach(type => {
            if (!this.canUseParentType(type)) return;
            const defaults = this.sim.flowerMainColorDefaults[type] || [];
            const defaultPattern = this.getDefaultPatternForType(type);

            defaults.forEach(color => {
                const solid = this.sim.createFlower(type, color, 'None', 'None');
                if (this.isValidFlower(solid)) {
                    terminals.set(this.flowerKey(solid), solid);
                }

                // Naturally occurring patterned defaults (e.g. Ombre Penstemum)
                if (defaultPattern && defaultPattern !== 'None') {
                    const patterned = this.patterned(type, color, defaultPattern, 'White');
                    if (this.isValidFlower(patterned)) {
                        terminals.set(this.flowerKey(patterned), patterned);
                    }
                }
            });
        });

        if (includeGridFlowers && this.sim.grid) {
            for (let r = 0; r < this.sim.grid.length; r++) {
                for (let c = 0; c < this.sim.grid[r].length; c++) {
                    const cell = this.sim.grid[r][c];
                    if (!cell || cell.disabled || !cell.flower) continue;
                    const flower = this.cloneFlower(cell.flower);
                    if (this.isValidFlower(flower) && this.canUseParentType(flower.type)) {
                        terminals.set(this.flowerKey(flower), flower);
                    }
                }
            }
        }

        return terminals;
    }

    solid(type, color) {
        return this.sim.createFlower(type, color, 'None', 'None');
    }

    patterned(type, mainColor, pattern, secondaryColor) {
        if (this.sim.getIsEffectPattern(pattern)) {
            return this.sim.createFlower(type, mainColor, pattern, 'None');
        }
        let sec = secondaryColor;
        if (!sec || sec === 'None') {
            sec = mainColor === 'White' ? 'Warm Pink' : 'White';
        }
        if (sec === mainColor) {
            sec = mainColor === 'White' ? 'Warm Pink' : 'White';
        }
        return this.sim.createFlower(type, mainColor, pattern, sec);
    }

    addCandidate(list, seen, p1, p2) {
        if (!p1 || !p2) return;
        if (!this.isValidFlower(p1) || !this.isValidFlower(p2)) return;
        if (!this.canUseParentType(p1.type) || !this.canUseParentType(p2.type)) return;

        const k1 = this.flowerKey(p1);
        const k2 = this.flowerKey(p2);
        const pairKey = k1 <= k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
        if (seen.has(pairKey)) return;
        seen.add(pairKey);
        list.push([this.cloneFlower(p1), this.cloneFlower(p2)]);
    }

    typesWithDefaultColor(color) {
        return (this.sim.allFlowerTypes || []).filter(type => {
            if (!this.canUseParentType(type)) return false;
            const defaults = this.sim.flowerMainColorDefaults[type] || [];
            return defaults.includes(color);
        });
    }

    sortTypesForDonor(types, color, pattern) {
        const defaultColor = new Set(this.typesWithDefaultColor(color));
        const defaultPattern = new Set();
        types.forEach(type => {
            if (this.getDefaultPatternForType(type) === pattern) {
                defaultPattern.add(type);
            }
        });
        const eventTypes = new Set(Object.values(this.sim.eventFlowers || {}));

        return [...types].sort((a, b) => {
            const score = (type) => {
                let s =
                    (defaultColor.has(type) ? 2 : 0) +
                    (defaultPattern.has(type) ? 4 : 0) +
                    (this.canUseType(type) ? 6 : 0);
                // Prefer everyday on-plot bridges over event flowers for effect transfers
                if (eventTypes.has(type)) s -= 2;
                if (this.sim.extremeFlowers?.includes(type) && this.getDefaultPatternForType(type) !== pattern) {
                    s -= 1;
                }
                return s;
            };
            return score(b) - score(a);
        });
    }

    generateCandidateParents(target) {
        const candidates = [];
        const seen = new Set();
        const type = target.type;
        const color = target.mainColor;
        const pattern = target.pattern || 'None';
        const secondary = target.secondaryColor || 'None';
        const reverseMix = this.buildReverseColorMix();
        const types = (this.sim.allFlowerTypes || []).filter(t => this.canUseParentType(t));
        const isEffect = this.sim.getIsEffectPattern(pattern);
        const isPatterned = pattern !== 'None';
        const defaults = this.sim.flowerMainColorDefaults[type] || [];
        const defaultPattern = this.getDefaultPatternForType(type);

        // Prefer native donors that already spawn in the target color (e.g. Heavy Nettle Orange Ombre)
        let donorTypes = this.sortTypesForDonor(types.filter(t => t !== type), color, pattern);

        // Effects (Glow/Cosmic/Molten/…): always keep native donors (e.g. Blazebulb→Molten).
        // Also keep on-plot bridge types so the *final* breed can use two plantable parents
        // (Blazebulb can't plant on Meadow, but Dandelily Coral Molten + Bellbutton Coral can).
        // Full unrestricted cross-type search still freezes — cap bridges.
        if (isEffect) {
            const nativeEffectDonors = donorTypes.filter(
                t => this.getDefaultPatternForType(t) === pattern
            );
            const onPlotBridges = donorTypes.filter(
                t => this.canUseType(t) && this.getDefaultPatternForType(t) !== pattern
            );
            const bridgeCap = 14;
            donorTypes = [...new Set([
                ...onPlotBridges.slice(0, bridgeCap),
                ...nativeEffectDonors
            ])];
            if (!donorTypes.length) {
                donorTypes = this.sortTypesForDonor(
                    types.filter(t => t !== type),
                    color,
                    pattern
                ).slice(0, 4);
            }
        }

        // Same-type color mix early (Red + Yellow → Orange). Must beat the huge
        // cross-type color-transfer candidate list or it never reaches verify.
        const mixParents = reverseMix[color] || [];
        mixParents.forEach(([c1, c2]) => {
            this.addCandidate(candidates, seen, this.solid(type, c1), this.solid(type, c2));
            if (isPatterned) {
                this.addCandidate(candidates, seen, this.patterned(type, c1, pattern, c2), this.solid(type, c2));
                this.addCandidate(candidates, seen, this.patterned(type, c1, pattern, secondary), this.solid(type, c2));
            }
        });

        // Hybridization first (before cross-type pattern-transfer donors): same type + same
        // pattern; child keeps one parent's main/pattern, secondary = other parent's main.
        // Example: Tulias Blue Ombre White + Tulias Orange Ombre White
        //       → Tulias Blue Ombre Orange (or Orange Ombre Blue).
        if (isPatterned && !isEffect && secondary !== 'None' && secondary !== color) {
            const defSec = (main) => (main === 'White' ? 'Warm Pink' : 'White');
            this.addCandidate(
                candidates,
                seen,
                this.patterned(type, color, pattern, defSec(color)),
                this.patterned(type, secondary, pattern, defSec(secondary))
            );
            this.addCandidate(
                candidates,
                seen,
                this.patterned(type, color, pattern, 'White'),
                this.patterned(type, secondary, pattern, 'White')
            );
            // One-patterned secondary-swap path (engine only when colors are mixable)
            this.addCandidate(
                candidates,
                seen,
                this.patterned(type, color, pattern, defSec(color)),
                this.solid(type, secondary)
            );
            // Once you already have hybrids, these help farm / continue chains
            this.addCandidate(
                candidates,
                seen,
                this.patterned(type, color, pattern, secondary),
                this.patterned(type, secondary, pattern, color)
            );
            this.addCandidate(
                candidates,
                seen,
                this.patterned(type, color, pattern, secondary),
                this.solid(type, secondary)
            );
        }

        // Pattern transfer / mutation — avoid filling the verify budget with chicken-egg self pairs
        if (isPatterned) {
            const secOptions = isEffect
                ? ['None']
                : [...new Set([secondary, 'White', 'Warm Pink'].filter(s => s && s !== color))];

            donorTypes.forEach(otherType => {
                const otherDefaultPat = this.getDefaultPatternForType(otherType);
                // Effects: only try the effect itself on the donor (not every default pattern)
                const patsToTry = isEffect
                    ? [pattern]
                    : [...new Set([
                        pattern,
                        otherDefaultPat !== 'None' ? otherDefaultPat : null
                    ].filter(Boolean))];

                patsToTry.forEach(pat => {
                    if (!isEffect && pat !== pattern) return;
                    secOptions.forEach(sec => {
                        const donor = this.patterned(otherType, color, pat, sec);
                        this.addCandidate(candidates, seen, donor, this.solid(type, color));
                        // Also pair with default-color solids of target type (color-transfer then pattern later)
                        if (!isEffect) {
                            defaults.forEach(defColor => {
                                if (defColor === color) return;
                                this.addCandidate(candidates, seen, donor, this.solid(type, defColor));
                                if (defaultPattern && defaultPattern !== 'None') {
                                    this.addCandidate(
                                        candidates,
                                        seen,
                                        donor,
                                        this.patterned(type, defColor, defaultPattern, 'White')
                                    );
                                }
                            });
                        }
                    });
                });

                if (!isEffect) {
                    this.addCandidate(
                        candidates,
                        seen,
                        this.patterned(type, color, pattern, secondary),
                        this.solid(otherType, color)
                    );
                }
            });
        }

        // Color transfer reverse: solid target from patterned donor of another type
        if (!isPatterned) {
            const recipientColors = [...new Set([
                ...defaults,
                'White',
                'Yellow',
                'Red',
                'Blue',
                'Magenta'
            ])].filter(c => c !== color);

            donorTypes.forEach(otherType => {
                const otherDefaultPat = this.getDefaultPatternForType(otherType);
                const allowed = (this.sim.flowerAllowedPattern?.[otherType] || []).filter(p => p !== 'None');
                const patternsToTry = [...new Set([
                    otherDefaultPat !== 'None' ? otherDefaultPat : null,
                    ...allowed.slice(0, 3)
                ].filter(Boolean))];

                patternsToTry.forEach(pat => {
                    recipientColors.forEach(otherColor => {
                        // Color transfer ignores secondary — always use default White
                        // (Warm Pink when main is White via patterned()).
                        const donor = this.patterned(
                            otherType,
                            color,
                            pat,
                            this.sim.getIsEffectPattern(pat) ? 'None' : 'White'
                        );
                        this.addCandidate(candidates, seen, donor, this.solid(type, otherColor));
                        if (defaultPattern && defaultPattern !== 'None') {
                            this.addCandidate(
                                candidates,
                                seen,
                                donor,
                                this.patterned(type, otherColor, defaultPattern, 'White')
                            );
                        }
                    });
                });
            });
        }

        // Default-color partners for same-type mixes
        defaults.forEach(d1 => {
            defaults.forEach(d2 => {
                if (d1 === d2) return;
                this.addCandidate(candidates, seen, this.solid(type, d1), this.solid(type, d2));
            });
            if (d1 !== color) {
                this.addCandidate(candidates, seen, this.solid(type, d1), this.solid(type, color));
            }
        });

        // Self / clone pairs last (useful for farming once you already have the flower)
        this.addCandidate(candidates, seen, target, target);
        this.addCandidate(candidates, seen, this.solid(type, color), this.solid(type, color));
        if (isPatterned) {
            this.addCandidate(candidates, seen, target, this.solid(type, color));
        }

        return this.prioritizeCandidates(candidates, target);
    }

    prioritizeCandidates(candidates, target = null) {
        const terminals = this._terminals;
        const tKey = target ? this.flowerKey(target) : null;
        const tgtPat = target ? (target.pattern || 'None') : 'None';
        const tgtSec = target ? (target.secondaryColor || 'None') : 'None';
        const tgtColor = target ? target.mainColor : null;
        const tgtType = target ? target.type : null;
        const isEffect = target && tgtPat !== 'None' && this.sim.getIsEffectPattern(tgtPat);
        const isPatterned = tgtPat !== 'None';

        return [...candidates].sort((a, b) => {
            const scorePair = (pair) => {
                let s = 0;
                if (terminals) {
                    if (this.isKnownOwned(pair[0], terminals)) s += 3;
                    if (this.isKnownOwned(pair[1], terminals)) s += 3;
                }
                // Prefer pairs that can both be planted on the current plot (Apply Layout)
                if (this.canUseType(pair[0].type)) s += 5;
                if (this.canUseType(pair[1].type)) s += 5;
                if (this.canUseType(pair[0].type) && this.canUseType(pair[1].type)) s += 8;

                // Solid color mix (Red + Yellow → Orange): same-type solids that reverse-mix
                // to the target color. Strongly prefer over color-transfer donors.
                if (target && this.isSolidColorMixPair(pair[0], pair[1], target)) {
                    s += 70;
                    if (terminals) {
                        if (this.isKnownOwned(pair[0], terminals)) s += 8;
                        if (this.isKnownOwned(pair[1], terminals)) s += 8;
                    }
                }

                // Prefer cross-type donors over needing the target itself as a parent
                if (tKey) {
                    if (this.flowerKey(pair[0]) === tKey || this.flowerKey(pair[1]) === tKey) s -= 5;
                    if (pair[0].type !== pair[1].type) s += 2;
                    if (target && pair[0].pattern === tgtPat && pair[0].type !== tgtType) s += 2;
                    if (target && pair[1].pattern === tgtPat && pair[1].type !== tgtType) s += 2;
                }

                // Patterned non-effect targets (e.g. Bellbutton Blush Ombre Ice):
                // classic pattern transfer is donor(same color+pattern+sec) + solid(same type+color).
                // Without this boost, owned default-color solids (Yellow/Blue/White) outrank the
                // real Blush solid partner and burn the verify budget before any hit.
                if (isPatterned && !isEffect && tgtColor && tgtType) {
                    const solidSameColor = (p) =>
                        (p.pattern || 'None') === 'None'
                        && p.type === tgtType
                        && p.mainColor === tgtColor;
                    const patternedDonor = (p) =>
                        (p.pattern || 'None') === tgtPat
                        && p.mainColor === tgtColor
                        && p.type !== tgtType;
                    const matchingSec = (p) =>
                        (p.pattern || 'None') !== 'None'
                        && (p.secondaryColor || 'None') === tgtSec;

                    if (solidSameColor(pair[0]) || solidSameColor(pair[1])) s += 14;
                    if (
                        (patternedDonor(pair[0]) && solidSameColor(pair[1]))
                        || (patternedDonor(pair[1]) && solidSameColor(pair[0]))
                    ) {
                        s += 18;
                    }
                    if (tgtSec !== 'None' && (matchingSec(pair[0]) || matchingSec(pair[1]))) {
                        s += 16;
                    }
                    // Soft-penalize White/Warm Pink stand-ins when seeking a custom secondary
                    // (but not for hybridization pairs — those intentionally use default secs).
                    const hybrid = this.isHybridizationPair(pair[0], pair[1], target);
                    if (hybrid) {
                        // Prefer hybrid acquisition over pattern-transferring a donor that
                        // already has the custom secondary (harder chicken-egg).
                        s += 55;
                        const defaultish = (p) => {
                            const sec = p.secondaryColor || 'None';
                            return sec === 'White' || sec === 'Warm Pink';
                        };
                        if (defaultish(pair[0]) && defaultish(pair[1])) s += 10;
                    } else if (tgtSec !== 'None' && tgtSec !== 'White' && tgtSec !== 'Warm Pink') {
                        const wrongSec = (p) => {
                            const sec = p.secondaryColor || 'None';
                            return (p.pattern || 'None') !== 'None'
                                && (sec === 'White' || sec === 'Warm Pink')
                                && sec !== tgtSec;
                        };
                        if (wrongSec(pair[0]) || wrongSec(pair[1])) s -= 10;
                        // Cross-type donors that already have the custom secondary are a
                        // later-step transfer, not the usual first way to unlock it.
                        if (matchingSec(pair[0]) || matchingSec(pair[1])) s -= 20;
                    }
                }
                return s;
            };
            return scorePair(b) - scorePair(a);
        });
    }

    /**
     * Same-type solid pair whose mains color-mix to the target's main color.
     * Example: Bellbutton Red + Bellbutton Yellow → Bellbutton Orange.
     */
    isSolidColorMixPair(parent1, parent2, target) {
        if (!parent1 || !parent2 || !target) return false;
        if ((target.pattern || 'None') !== 'None') return false;
        if (parent1.type !== target.type || parent2.type !== target.type) return false;
        if ((parent1.pattern || 'None') !== 'None' || (parent2.pattern || 'None') !== 'None') {
            return false;
        }
        if (parent1.mainColor === parent2.mainColor) return false;
        try {
            return this.sim.color_mix(parent1.mainColor, parent2.mainColor) === target.mainColor;
        } catch (e) {
            return false;
        }
    }

    /**
     * Same-type patterned pair whose mains are the target's main + secondary colors.
     * Used for hybridization (Color Mix Residual) acquisition.
     */
    isHybridizationPair(parent1, parent2, target) {
        if (!parent1 || !parent2 || !target) return false;
        const tgtPat = target.pattern || 'None';
        const tgtSec = target.secondaryColor || 'None';
        if (tgtPat === 'None' || tgtSec === 'None') return false;
        if (this.sim.getIsEffectPattern(tgtPat)) return false;
        if (parent1.type !== target.type || parent2.type !== target.type) return false;
        if ((parent1.pattern || 'None') !== tgtPat || (parent2.pattern || 'None') !== tgtPat) return false;
        const mains = new Set([parent1.mainColor, parent2.mainColor]);
        return mains.has(target.mainColor) && mains.has(tgtSec);
    }

    isChickenEggPair(parent1, parent2, target, terminals) {
        if (!target || !terminals || this.isKnownOwned(target, terminals)) return false;
        const tKey = this.flowerKey(target);
        return this.flowerKey(parent1) === tKey || this.flowerKey(parent2) === tKey;
    }

    /**
     * Single-parent clone odds matching calculateCellPossibilities (1 neighbor).
     * Greenhouse patterned: FallbackPatternCloneChance (20%).
     * Outdoor patterned: PatternedClone (1%). Solids: 100% of the breed pool.
     */
    verifySingleParentClone(parent, target) {
        if (!this.canCloneFlowerToTarget(parent, target)) return null;

        return this.withLayoutBreedContext(() => {
            const srcPat = parent.pattern || 'None';
            const tgtPat = target.pattern || 'None';
            let percentage;
            let weight;
            const sources = {};

            if (srcPat === 'None') {
                // Solid → solid clone only
                if (tgtPat !== 'None') return null;
                weight = this.sim.getSingleParentUnpatternedParentWeight();
                percentage = 100;
                sources['Single Parent Clone Simple Clone'] = weight;
            } else if (tgtPat === 'None') {
                // Patterned parent stripping to solid
                weight = this.sim.getSingleParentPatternedSolidWeight();
                const cloneW = this.sim.getSingleParentPatternedCloneWeight();
                const total = weight + cloneW;
                percentage = total > 0 ? (weight / total) * 100 : 0;
                sources['Single Parent Non-Patterned Simple Clone'] = weight;
            } else {
                // Patterned → patterned (secondary reset already checked in canClone)
                weight = this.sim.getSingleParentPatternedCloneWeight();
                const solidW = this.sim.getSingleParentPatternedSolidWeight();
                const total = weight + solidW;
                percentage = total > 0 ? (weight / total) * 100 : 0;
                sources['Single Parent Patterned Simple Clone'] = weight;
            }

            if (percentage <= 0) return null;

            return {
                parent1: this.cloneFlower(parent),
                parent2: this.cloneFlower(parent),
                percentage,
                weight,
                sources,
                isClone: true
            };
        });
    }

    verifyPair(parent1, parent2, target) {
        if (this._verifyCount >= this.maxVerifyBudget) return null;
        this._verifyCount += 1;

        // Identical parents: report accurate single-parent clone % (layout-optimal path)
        // when Greenhouse is on — in-game 1-neighbor patterned clone is 20%, not the
        // 1% identical-pair PatternedClone from breedTwoFlowers.
        if (this.flowerKey(parent1) === this.flowerKey(parent2)) {
            const cloneHit = this.verifySingleParentClone(parent1, target);
            if (cloneHit) return cloneHit;
            // Fall through for edge cases (e.g. solid strip from mismatched pattern pair)
        }

        return this.withPlanningBreedContext(() => {
            const breeder = new FlowerBreeder(this.sim, 10);
            if (typeof breeder.setDebugMode === 'function') {
                breeder.setDebugMode(false);
            }

            const result = this.sim.breedTwoFlowers(parent1, parent2, {
                breeder,
                deferPercentages: false,
                parent_idx: 10
            });

            if (!result) return null;

            result.updatePercentages(true, 0);
            const targetKey = this.flowerKey(target);
            const entry = result.consolidatedResults[targetKey];
            if (!entry) return null;

            const total = Object.values(result.consolidatedResults)
                .reduce((sum, e) => sum + e.totalWeight, 0);
            if (total <= 0) return null;

            const percentage = (entry.totalWeight / total) * 100;
            if (percentage <= 0) return null;

            // Preserve breed-source labels (Pattern Transfer, Color Transfer, etc.)
            const sources = {};
            (entry.sources || []).forEach(src => {
                const label = src.label || src.breedRes || 'Unknown';
                const w = src.weight || 0;
                if (w > 0) sources[label] = (sources[label] || 0) + w;
            });

            return {
                parent1: this.cloneFlower(parent1),
                parent2: this.cloneFlower(parent2),
                percentage,
                weight: entry.totalWeight,
                sources
            };
        });
    }

    findVerifiedParents(target) {
        const key = this.flowerKey(target);
        if (this.pairCache.has(key)) {
            return this.pairCache.get(key);
        }

        const candidates = this.generateCandidateParents(target);
        const verified = [];
        const seenKeys = new Set();
        // Stop once we have enough unique parents — overshooting (*3) forced the
        // search to keep verifying after all valid pattern-transfer donors were
        // found (e.g. ~25 Ombre/Ice donors) and burned the global verify budget.
        const verifyCap = this.maxPairsPerFlower;

        for (const [p1, p2] of candidates) {
            if (this._verifyCount >= this.maxVerifyBudget) break;
            // Allow self-clone pairs when Greenhouse is on (farming layouts); still
            // block unowned self-parents outdoors / as acquisition recipes.
            const selfPair = this.flowerKey(p1) === this.flowerKey(p2)
                && this.flowerKey(p1) === this.flowerKey(target);
            if (this.isChickenEggPair(p1, p2, target, this._terminals)) {
                if (!(selfPair && this.isGreenhouseEnabled())) continue;
            }

            const hit = this.verifyPair(p1, p2, target);
            if (!hit) continue;

            const pairKey = [this.flowerKey(hit.parent1), this.flowerKey(hit.parent2)].sort().join('|');
            if (seenKeys.has(pairKey)) continue;
            seenKeys.add(pairKey);
            verified.push(hit);

            if (verified.length >= verifyCap) break;
        }

        verified.sort((a, b) => {
            const usefulScore = (pair) => {
                let s = 0;
                if (this._terminals && this.isKnownOwned(pair.parent1, this._terminals)) s += 2;
                if (this._terminals && this.isKnownOwned(pair.parent2, this._terminals)) s += 2;
                // Prefer parents that can actually be planted on the current plot
                if (this.canUseType(pair.parent1.type)) s += 4;
                if (this.canUseType(pair.parent2.type)) s += 4;
                // Color mix / hybridization beat cross-type transfer for acquisition recipes
                if (this.isSolidColorMixPair(pair.parent1, pair.parent2, target)) {
                    s += 25;
                } else if (this.isHybridizationPair(pair.parent1, pair.parent2, target)) {
                    s += 20;
                    const defaultish = (p) => {
                        const sec = p.secondaryColor || 'None';
                        return sec === 'White' || sec === 'Warm Pink';
                    };
                    if (defaultish(pair.parent1) && defaultish(pair.parent2)) s += 8;
                } else {
                    if (pair.parent1.type !== pair.parent2.type) s += 1;
                    if (pair.parent1.type !== target.type && pair.parent1.pattern === (target.pattern || 'None')) s += 2;
                    if (pair.parent2.type !== target.type && pair.parent2.pattern === (target.pattern || 'None')) s += 2;
                }
                return s;
            };
            const ud = usefulScore(b) - usefulScore(a);
            if (ud !== 0) return ud;
            return b.percentage - a.percentage;
        });

        const top = verified.slice(0, this.maxPairsPerFlower);
        this.pairCache.set(key, top);
        return top;
    }

    isKnownOwned(flower, terminals) {
        return terminals.has(this.flowerKey(flower));
    }

    isSelfCloneStep(step) {
        if (!step) return false;
        if (step.kind === 'clone') return true;
        const r = this.flowerKey(step.result);
        return !!step.parent1 && !!step.parent2
            && this.flowerKey(step.parent1) === r
            && this.flowerKey(step.parent2) === r;
    }

    scorePlan(steps, terminals) {
        if (!steps.length) return -Infinity;
        const stepCount = steps.length;
        const product = steps.reduce((acc, step) => acc * (step.percentage / 100), 1);
        let ownedBonus = 0;
        let selfClonePenalty = 0;
        steps.forEach(step => {
            if (step.parent1 && this.isKnownOwned(step.parent1, terminals)) ownedBonus += 2;
            if (step.parent2 && this.isKnownOwned(step.parent2, terminals)) ownedBonus += 2;
            // Greenhouse clone farming is intentional — only hard-penalize outdoors / unowned acquisition
            if (this.isSelfCloneStep(step) && !this.isKnownOwned(step.result, terminals)) {
                selfClonePenalty += this.isGreenhouseEnabled() ? 25 : 500;
            }
        });

        const finalStep = steps[steps.length - 1];
        let onPlotFinalBonus = 0;
        let defaultFertilizeBonus = 0;
        let nativePatternTransferPenalty = 0;

        if (finalStep?.kind === 'fertilize' && finalStep.result) {
            // Default pattern/effect via fertilize (e.g. Bubbaluna → Cosmic) beats pattern transfer
            defaultFertilizeBonus = 12000;
            if (finalStep.parent1 && this.canUseType(finalStep.parent1.type)) {
                onPlotFinalBonus = 4000;
            }
            // Prefer showing how to get the solid when it isn't a free default/grid flower
            if (
                steps.length > 1 &&
                finalStep.parent1 &&
                !this.isKnownOwned(finalStep.parent1, terminals)
            ) {
                defaultFertilizeBonus += 1500;
            }
        } else if (finalStep?.parent1 && finalStep?.parent2) {
            const bothOnPlot =
                this.canUseType(finalStep.parent1.type) &&
                this.canUseType(finalStep.parent2.type);
            onPlotFinalBonus = bothOnPlot ? 8000 : -2000;

            // Breeding a flower's own default pattern/effect is usually worse than fertilize
            const result = finalStep.result;
            if (result) {
                const defPat = this.getDefaultPatternForType(result.type);
                if (defPat && defPat !== 'None' && result.pattern === defPat) {
                    nativePatternTransferPenalty = 9000;
                }
            }
        }

        let hybridBonus = 0;
        let colorMixBonus = 0;
        if (finalStep?.parent1 && finalStep?.parent2 && finalStep?.result) {
            if (this.isSolidColorMixPair(finalStep.parent1, finalStep.parent2, finalStep.result)) {
                colorMixBonus = 6000;
            }
            const tgtSec = finalStep.result.secondaryColor || 'None';
            if (
                tgtSec !== 'None' && tgtSec !== 'White' && tgtSec !== 'Warm Pink'
                && this.isHybridizationPair(finalStep.parent1, finalStep.parent2, finalStep.result)
            ) {
                hybridBonus = 7000;
                const defaultish = (p) => {
                    const sec = p.secondaryColor || 'None';
                    return sec === 'White' || sec === 'Warm Pink';
                };
                if (defaultish(finalStep.parent1) && defaultish(finalStep.parent2)) {
                    hybridBonus += 1500;
                }
            }
        }

        // Prefer recipes that show how to get an on-plot effect carrier from a native
        // donor (Blazebulb Molten → Dandelily Molten → Bellbutton Molten on Meadow).
        let effectBridgeBonus = 0;
        for (const step of steps) {
            if (!step?.parent1 || !step?.parent2 || !step?.result) continue;
            const resPat = step.result.pattern || 'None';
            if (!this.sim.getIsEffectPattern(resPat)) continue;
            if (this.getDefaultPatternForType(step.result.type) === resPat) continue;
            const nativeDonor =
                (this.getDefaultPatternForType(step.parent1.type) === resPat
                    && (step.parent1.pattern || 'None') === resPat)
                || (this.getDefaultPatternForType(step.parent2.type) === resPat
                    && (step.parent2.pattern || 'None') === resPat);
            if (nativeDonor && this.canUseType(step.result.type)) {
                effectBridgeBonus += 3500;
            }
        }

        // Prefer native fertilize, on-plot finals, color mix / hybridization, fewer steps, higher odds
        return (
            defaultFertilizeBonus +
            onPlotFinalBonus +
            colorMixBonus +
            hybridBonus +
            effectBridgeBonus +
            (8 - stepCount) * 1000 +
            product * 100 +
            ownedBonus -
            selfClonePenalty -
            nativePatternTransferPenalty
        );
    }

    /**
     * Steps that only produce solids (color transfers / mixes). Used to block
     * nonsense chains that pattern-transfer Confetti/etc. just to reach a solid.
     */
    isCleanSolidAcquisition(steps) {
        if (!steps || !steps.length) return true;
        return steps.every(step => {
            if (!step.result) return true;
            return (step.result.pattern || 'None') === 'None';
        });
    }

    /** Fertilize recipes: at most one solid-getting breed, then fertilize. */
    isSensibleFertilizePlan(steps) {
        if (!steps?.length) return false;
        const finalStep = steps[steps.length - 1];
        if (finalStep.kind !== 'fertilize') return true;
        if (steps.length > 2) return false;
        return this.isCleanSolidAcquisition(steps.slice(0, -1));
    }

    /**
     * Hide off-plot acquisition steps (assume those flowers are obtained elsewhere).
     * Keep steps whose result is plantable here, plus the final target step.
     */
    getDisplaySteps(steps) {
        if (!steps || !steps.length) return [];
        return steps.filter((step, idx) => {
            const isFinal = idx === steps.length - 1;
            if (isFinal) return true;
            if (!step.result) return false;
            return this.canUseType(step.result.type);
        });
    }

    finalParentsPlantableOnPlot(plan) {
        if (!plan?.parent1 || !plan?.parent2) return false;
        if (plan.steps?.[plan.steps.length - 1]?.kind === 'fertilize') return false;
        return this.canUseType(plan.parent1.type) && this.canUseType(plan.parent2.type);
    }

    mergeUniqueSteps(chainA, chainB) {
        const merged = [];
        const seen = new Set();
        [...chainA, ...chainB].forEach(step => {
            const p2Key = step.parent2 ? this.flowerKey(step.parent2) : (step.kind || 'fertilize');
            const key = `${this.flowerKey(step.parent1)}|${p2Key}|${this.flowerKey(step.result)}|${step.kind || 'breed'}`;
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(step);
        });
        return merged;
    }

    /**
     * Solids only: assume-owned plus at most one breed hop from known defaults/grid.
     * Never recurses — prevents combinatorial freeze on color-transfer reverse search.
     */
    solveSolidOneHop(flower, terminals) {
        const key = `solid1|${this.flowerKey(flower)}`;
        if (this.memo.has(key)) return this.memo.get(key);

        const plans = [[]]; // always allow "already have it"
        if (this.isKnownOwned(flower, terminals)) {
            this.memo.set(key, plans);
            return plans;
        }

        // Cap verifies for optional solid acquisition so root pattern-transfer
        // pairs (e.g. many Ombre/Ice donors) are not starved of budget.
        const verifyBefore = this._verifyCount;
        const solidVerifyAllowance = 48;
        const savedBudget = this.maxVerifyBudget;
        this.maxVerifyBudget = Math.min(savedBudget, verifyBefore + solidVerifyAllowance);

        try {
            const pairs = this.findVerifiedParents(flower);
            for (const pair of pairs) {
                // Only keep hops that use at least one known inventory flower
                const p1Owned = this.isKnownOwned(pair.parent1, terminals);
                const p2Owned = this.isKnownOwned(pair.parent2, terminals);
                if (!p1Owned && !p2Owned) continue;
                // Prefer patterned donor + default solid (typical color transfer)
                if ((pair.parent1.pattern || 'None') === 'None' && (pair.parent2.pattern || 'None') === 'None') {
                    if (!p1Owned || !p2Owned) continue;
                }

                plans.push([{
                    parent1: pair.parent1,
                    parent2: pair.parent2,
                    result: this.cloneFlower(flower),
                    percentage: pair.percentage,
                    kind: 'breed',
                    sources: pair.sources ? { ...pair.sources } : null
                }]);
                if (plans.length >= 8) break;
            }
        } finally {
            this.maxVerifyBudget = savedBudget;
        }

        this.memo.set(key, plans);
        return plans;
    }

    solveFlower(flower, depthRemaining, maxSteps, terminals, visiting, isRoot = false) {
        const key = this.flowerKey(flower);
        const memoKey = `${key}|${depthRemaining}|${isRoot ? 'R' : 'P'}`;
        if (this.memo.has(memoKey)) {
            return this.memo.get(memoKey);
        }

        // Defaults + grid flowers are free terminals.
        if (!isRoot && this.isKnownOwned(flower, terminals)) {
            const empty = [[]];
            this.memo.set(memoKey, empty);
            return empty;
        }

        // Off-plot prerequisites are assumed obtained elsewhere (skip those acquisition steps).
        if (!isRoot && !this.canUseType(flower.type)) {
            const empty = [[]];
            this.memo.set(memoKey, empty);
            return empty;
        }

        if (depthRemaining <= 0) {
            // On-plot but not a default: still allow using it as a brought-in parent
            // so final on-plot breeds (and Apply Layout) can proceed.
            const fallback = isRoot ? [] : [[]];
            this.memo.set(memoKey, fallback);
            return fallback;
        }

        if (visiting.has(key)) {
            return [];
        }

        visiting.add(key);
        const plans = [];
        const seekingSolid = (flower.pattern || 'None') === 'None';

        // Non-root solids: one-hop from inventory only. Deep solid reverse-search
        // (every type × color) is what froze Bellbutton Indigo Glow planning.
        if (!isRoot && seekingSolid) {
            const shallow = this.solveSolidOneHop(flower, terminals);
            visiting.delete(key);
            this.memo.set(memoKey, shallow);
            return shallow;
        }

        // Non-root patterned/effect parents: assume obtained (omit acquisition), same
        // idea as color-transfer donors. Deep-solving e.g. Anemone Blush Ombre Ice
        // while planning Bellbutton Blush Ombre Ice burns the verify budget before
        // the final on-plot pattern-transfer step can be assembled.
        // Exception: on-plot effect bridges (Dandelily Coral Molten) may one-hop from a
        // native effect donor (Blazebulb) so CAF can show how to get a plantable carrier.
        if (!isRoot && !seekingSolid) {
            plans.push([]);
            const fertSolid = this.getFertilizeSource(flower);
            if (fertSolid) {
                const solidPlans = this.solveSolidOneHop(fertSolid, terminals);
                const fertPct = this.getFertilizePatternChance() * 100;
                for (const c1 of solidPlans) {
                    if (!this.isCleanSolidAcquisition(c1)) continue;
                    const step = {
                        parent1: this.cloneFlower(fertSolid),
                        parent2: null,
                        result: this.cloneFlower(flower),
                        percentage: fertPct,
                        kind: 'fertilize',
                        sources: { Fertilize: 1 }
                    };
                    const full = [...c1, step];
                    if (full.length > 0 && full.length <= maxSteps) {
                        plans.push(full);
                    }
                    if (plans.length >= this.maxPlans) break;
                }
            }

            const pat = flower.pattern || 'None';
            if (
                this.sim.getIsEffectPattern(pat)
                && this.canUseType(flower.type)
                && this.getDefaultPatternForType(flower.type) !== pat
                && depthRemaining > 0
            ) {
                const natives = (this.sim.allFlowerTypes || []).filter(
                    t => this.getDefaultPatternForType(t) === pat
                );
                for (const nativeType of natives) {
                    if (this._verifyCount >= this.maxVerifyBudget) break;
                    const donor = this.patterned(nativeType, flower.mainColor, pat, 'None');
                    const solidPartner = this.solid(flower.type, flower.mainColor);
                    if (!this.isValidFlower(donor) || !this.isValidFlower(solidPartner)) continue;
                    if (this.isChickenEggPair(donor, solidPartner, flower, terminals)) continue;
                    const hit = this.verifyPair(donor, solidPartner, flower);
                    if (!hit) continue;
                    const step = {
                        parent1: hit.parent1,
                        parent2: hit.parent2,
                        result: this.cloneFlower(flower),
                        percentage: hit.percentage,
                        kind: 'breed',
                        sources: hit.sources ? { ...hit.sources } : null
                    };
                    if (step && 1 <= maxSteps) {
                        plans.push([step]);
                    }
                }
            }

            plans.sort((a, b) => this.scorePlan(b, terminals) - this.scorePlan(a, terminals));
            const trimmed = plans.slice(0, this.maxPlans);
            if (!trimmed.some(p => p.length === 0)) {
                trimmed[trimmed.length - 1] = [];
            }
            visiting.delete(key);
            this.memo.set(memoKey, trimmed);
            return trimmed;
        }

        // Fertilize solid → default pattern/effect (e.g. Bubbaluna Coral → Cosmic)
        const fertSolid = this.getFertilizeSource(flower);
        if (fertSolid) {
            // Assume the solid is obtained (or one-hop); never deep-solve it here
            const solidPlans = this.solveSolidOneHop(fertSolid, terminals);
            const fertPct = this.getFertilizePatternChance() * 100;
            for (const c1 of solidPlans) {
                if (!this.isCleanSolidAcquisition(c1)) continue;
                const step = {
                    parent1: this.cloneFlower(fertSolid),
                    parent2: null,
                    result: this.cloneFlower(flower),
                    percentage: fertPct,
                    kind: 'fertilize',
                    sources: { Fertilize: 1 }
                };
                const full = [...c1, step];
                if (full.length > 0 && full.length <= maxSteps) {
                    plans.push(full);
                }
                if (plans.length >= this.maxPlans) break;
            }
        }

        // Root target that is a native default pattern/effect: fertilize only — never
        // pattern-transfer Cosmic/Ombre/etc. onto a flower that gets it from fertilizer.
        const skipBreedForNativeDefault = isRoot && !!fertSolid;

        if (!skipBreedForNativeDefault) {
            const pairs = this.findVerifiedParents(flower);
            for (const pair of pairs) {
                // Patterned parents: recurse. Solids: one-hop only (no deep tree).
                let plans1 = ((pair.parent1.pattern || 'None') === 'None')
                    ? this.solveSolidOneHop(pair.parent1, terminals)
                    : this.solveFlower(pair.parent1, depthRemaining - 1, maxSteps, terminals, visiting, false);
                let plans2 = ((pair.parent2.pattern || 'None') === 'None')
                    ? this.solveSolidOneHop(pair.parent2, terminals)
                    : this.solveFlower(pair.parent2, depthRemaining - 1, maxSteps, terminals, visiting, false);

                // Patterned color-transfer donors: assume already obtained
                if ((pair.parent1.pattern || 'None') !== 'None' && seekingSolid) plans1 = [[]];
                if ((pair.parent2.pattern || 'None') !== 'None' && seekingSolid) plans2 = [[]];

                // Shortest parent chains first so 1-step finals aren't crowded out of maxPlans.
                // Also keep one non-empty chain per side so effect-bridge steps
                // (native Molten donor → on-plot carrier) aren't dropped by the [] shortcut.
                const pickChainVariants = (list) => {
                    const sorted = [...list].sort((a, b) => a.length - b.length);
                    const out = [];
                    if (sorted[0]) out.push(sorted[0]);
                    const withSteps = sorted.find(p => p.length > 0);
                    if (withSteps && withSteps !== out[0]) out.push(withSteps);
                    return out.slice(0, 2);
                };
                plans1 = pickChainVariants(plans1);
                plans2 = pickChainVariants(plans2);

                for (let i = 0; i < plans1.length; i++) {
                    for (let j = 0; j < plans2.length; j++) {
                        const merged = this.mergeUniqueSteps(plans1[i], plans2[j]);
                        if (seekingSolid && !this.isCleanSolidAcquisition(merged)) continue;
                        const step = {
                            parent1: pair.parent1,
                            parent2: pair.parent2,
                            result: this.cloneFlower(flower),
                            percentage: pair.percentage,
                            kind: 'breed',
                            sources: pair.sources ? { ...pair.sources } : null
                        };
                        const full = [...merged, step];
                        if (full.length > 0 && full.length <= maxSteps) {
                            plans.push(full);
                        }
                        if (plans.length >= this.maxPlans) break;
                    }
                    if (plans.length >= this.maxPlans) break;
                }
                if (plans.length >= this.maxPlans) break;
            }
        }

        visiting.delete(key);

        // Non-root flowers can always be treated as already obtained (skip acquisition).
        // Needed so a final on-plot breed isn't blocked when parent recipes are long
        // or rely on off-plot / non-default paths the UI omits.
        if (!isRoot) {
            plans.unshift([]);
        }

        plans.sort((a, b) => {
            // Prefer real recipes over "already have it", but keep the empty option
            const emptyBias = (steps) => (steps.length === 0 ? -1 : 0);
            const sa = this.scorePlan(a, terminals) + emptyBias(a);
            const sb = this.scorePlan(b, terminals) + emptyBias(b);
            return sb - sa;
        });
        const trimmed = plans.slice(0, this.maxPlans);
        // Ensure empty "already owned" option survives trimming for non-root
        if (!isRoot && !trimmed.some(p => p.length === 0)) {
            trimmed[trimmed.length - 1] = [];
        }
        this.memo.set(memoKey, trimmed);
        return trimmed;
    }

    findPlans(targetInput, options = {}) {
        const maxSteps = Math.min(6, Math.max(1, options.maxSteps || 5));
        const includeGridFlowers = options.includeGridFlowers !== false;
        const target = this.normalizeTarget(targetInput);

        if (!this.isValidFlower(target)) {
            return { target, plans: [], error: 'Invalid flower combination.' };
        }
        if (!this.canUseType(target.type)) {
            return { target, plans: [], error: `${target.type} cannot be planted in the current plot layout.` };
        }

        this.memo = new Map();
        this.pairCache = new Map();
        this._verifyCount = 0;

        const terminals = this.getTerminalFlowers(includeGridFlowers);
        this._terminals = terminals;
        const alreadyOwned = this.isKnownOwned(target, terminals);

        let chains = [];
        try {
            // Even if already owned, still search for breeding recipes (useful for farming)
            chains = this.solveFlower(target, maxSteps, maxSteps, terminals, new Set(), true);
        } finally {
            this._terminals = terminals;
        }

        const targetKey = this.flowerKey(target);
        const cloneEligible = this.isGreenhouseEnabled()
            && this.canCloneFlowerToTarget(target, target)
            && this.canUseType(target.type);

        const plans = chains
            .filter(steps => {
                if (!steps.length || steps.length > maxSteps) return false;
                const finalStep = steps[steps.length - 1];
                if (!finalStep || this.flowerKey(finalStep.result) !== targetKey) return false;
                // Drop Confetti→Speckled→… sagas that only exist to fertilize at the end
                if (finalStep.kind === 'fertilize' && !this.isSensibleFertilizePlan(steps)) {
                    return false;
                }
                return true;
            })
            .map(steps => {
                const finalStep = steps[steps.length - 1];
                const displaySteps = this.getDisplaySteps(steps);
                const isCloneStep = finalStep.kind === 'clone'
                    || (finalStep.kind !== 'fertilize'
                        && this.flowerKey(finalStep.parent1) === this.flowerKey(finalStep.parent2)
                        && this.flowerKey(finalStep.parent1) === targetKey);
                return {
                    steps,
                    displaySteps,
                    score: this.scorePlan(steps, terminals),
                    finalPercentage: finalStep.percentage,
                    parent1: finalStep.parent1,
                    parent2: finalStep.parent2,
                    layouts: [],
                    endsWithFertilize: finalStep.kind === 'fertilize',
                    isClonePlan: !!isCloneStep,
                    finalParentsOnPlot: !!(
                        finalStep.parent1 &&
                        finalStep.parent2 &&
                        finalStep.kind !== 'fertilize' &&
                        this.canUseType(finalStep.parent1.type) &&
                        this.canUseType(finalStep.parent2.type)
                    )
                };
            })
            .sort((a, b) => b.score - a.score);

        // Dedicated Greenhouse clone-farming plan (accurate single-parent odds).
        // When unowned, append after acquisition recipes; when owned, rank with farming options.
        if (cloneEligible) {
            const cloneHit = this.verifySingleParentClone(target, target);
            if (cloneHit && !plans.some(p => p.isClonePlan)) {
                const cloneStep = {
                    kind: 'clone',
                    parent1: cloneHit.parent1,
                    parent2: cloneHit.parent2,
                    result: this.cloneFlower(target),
                    percentage: cloneHit.percentage,
                    sources: cloneHit.sources
                };
                const clonePlan = {
                    steps: [cloneStep],
                    displaySteps: [cloneStep],
                    score: this.scorePlan([cloneStep], terminals) + (alreadyOwned ? 50 : -4000),
                    finalPercentage: cloneHit.percentage,
                    parent1: cloneHit.parent1,
                    parent2: cloneHit.parent2,
                    layouts: [],
                    endsWithFertilize: false,
                    isClonePlan: true,
                    finalParentsOnPlot: true
                };
                if (alreadyOwned) {
                    plans.unshift(clonePlan);
                    plans.sort((a, b) => b.score - a.score);
                } else {
                    plans.push(clonePlan);
                }
            }
        }

        // Collapse near-duplicates: same fertilize solid / same final breed pair.
        // Hybridization especially used to fill maxPlans with identical White+White finals
        // that only differed by omitted parent-acquisition fluff.
        const deduped = [];
        const seenFert = new Set();
        const seenBreedPair = new Set();
        for (const plan of plans) {
            if (plan.endsWithFertilize) {
                const solidKey = plan.steps[plan.steps.length - 1].parent1
                    ? this.flowerKey(plan.steps[plan.steps.length - 1].parent1)
                    : '';
                const pre = plan.steps.slice(0, -1);
                const sig = pre.length === 0
                    ? `fert-only|${solidKey}`
                    : `fert|${solidKey}|${pre.map(s => this.flowerKey(s.result)).join('>')}`;
                if (seenFert.has(sig)) continue;
                seenFert.add(sig);
                deduped.push(plan);
                continue;
            }
            if (plan.parent1 && plan.parent2 && !plan.isClonePlan) {
                const pairSig = this.pairLayoutKey(plan.parent1, plan.parent2);
                if (seenBreedPair.has(pairSig)) continue;
                seenBreedPair.add(pairSig);
            }
            deduped.push(plan);
        }

        let finalPlans = deduped.slice(0, this.maxPlans);
        // Keep the greenhouse clone plan even if it fell past maxPlans
        const clonePlan = deduped.find(p => p.isClonePlan);
        if (clonePlan && !finalPlans.some(p => p.isClonePlan)) {
            if (finalPlans.length >= this.maxPlans) {
                finalPlans[finalPlans.length - 1] = clonePlan;
            } else {
                finalPlans.push(clonePlan);
            }
        }

        // Layouts attached asynchronously (exact DP/B&B can take a bit on 5x5+)
        for (const plan of finalPlans) {
            plan.layouts = [];
            plan.layoutsPending = !!plan.finalParentsOnPlot || !!plan.isClonePlan;
        }

        return { target, plans: finalPlans, error: null, alreadyOwned, layoutsPending: true };
    }

    pairLayoutKey(parent1, parent2) {
        return [this.flowerKey(parent1), this.flowerKey(parent2)].sort().join('|');
    }

    /** Fingerprint breeding LUT so equivalent pairs (e.g. any Blue Ring + Bellbutton Blue) share one layout solve. */
    fingerprintLut(lut, same) {
        let out = same ? '1' : '0';
        for (let i = 0; i <= 8; i++) {
            for (let j = 0; j <= 8; j++) {
                const v = lut[i][j] || 0;
                out += v > 0 ? `,${v.toFixed(8)}` : ',0';
            }
        }
        return out;
    }

    toAbstractLayouts(layouts) {
        return (layouts || []).map((layout) => ({
            signature: layout.signature,
            score: layout.score,
            expectedCount: layout.expectedCount,
            breedableCells: layout.breedableCells,
            exact: !!layout.exact,
            isCloneLayout: !!layout.isCloneLayout
        })).filter((layout) => typeof layout.signature === 'string');
    }

    materializeAbstractLayouts(abstracts, parent1, parent2, cells) {
        return (abstracts || []).map((abs, i) => {
            const state = new Uint8Array(abs.signature.length);
            for (let k = 0; k < abs.signature.length; k++) {
                state[k] = abs.signature.charCodeAt(k) - 48; // '0'/'1'/'2'
            }
            const layout = this.stateToLayout(
                state,
                cells,
                parent1,
                parent2,
                {
                    score: abs.score,
                    expectedCount: abs.expectedCount,
                    breedableCells: abs.breedableCells
                },
                abs.exact
            );
            layout.name = this.layoutOptionName(i, { isClone: !!abs.isCloneLayout });
            if (abs.isCloneLayout) layout.isCloneLayout = true;
            return layout;
        });
    }

    /** Friendly display names for ranked layout suggestions. */
    layoutOptionName(index, { isClone = false } = {}) {
        if (isClone) {
            if (index === 0) return 'Recommended Clone Layout';
            return `Alternative #${index} Clone Layout`;
        }
        if (index === 0) return 'Recommended Layout';
        return `Alternative #${index} Layout`;
    }

    tagCloneLayouts(layouts) {
        return (layouts || []).map((layout, idx) => ({
            ...layout,
            isCloneLayout: true,
            name: this.layoutOptionName(idx, { isClone: true })
        }));
    }

    throwIfCancelled(isCancelled) {
        if (typeof isCancelled === 'function' && isCancelled()) {
            const err = new Error('CAF_SEARCH_CANCELLED');
            err.code = 'CAF_SEARCH_CANCELLED';
            throw err;
        }
    }

    async yieldCancelled(isCancelled) {
        await new Promise(r => setTimeout(r, 0));
        this.throwIfCancelled(isCancelled);
    }

    /**
     * Attach exact optimal layouts to plans (async, yields so the UI stays responsive).
     * Uses row DP (or B&B fallback). When Greenhouse is on, also attaches clone-farming
     * layouts using in-game single-parent clone odds.
     */
    async attachExactLayouts(plans, target, onProgress = null, options = {}) {
        const isCancelled = options.isCancelled || null;
        const layoutCache = new Map();
        const uniquePairs = [];
        // Equivalent breeding LUTs (same odds shape) share one expensive geometry solve.
        this._layoutAbstractCache = new Map();
        this._layoutExpensiveSolves = 0;
        // Large plots: only fully solve a couple of distinct odds-shapes (best plans first).
        const plantableCount = this.getPlantableCells().length;
        this._layoutMaxExpensiveSolves = plantableCount > 40 ? 2 : (plantableCount > 24 ? 4 : 12);
        const cloneEligible = this.isGreenhouseEnabled()
            && this.canCloneFlowerToTarget(target, target)
            && this.canUseType(target.type);
        const clonePairKey = this.pairLayoutKey(target, target);

        const queuePair = (parent1, parent2) => {
            if (!parent1 || !parent2) return;
            const pairKey = this.pairLayoutKey(parent1, parent2);
            if (layoutCache.has(pairKey)) return;
            layoutCache.set(pairKey, null);
            uniquePairs.push({ pairKey, parent1, parent2 });
        };

        for (const plan of plans || []) {
            if (plan.finalParentsOnPlot && plan.parent1 && plan.parent2) {
                queuePair(plan.parent1, plan.parent2);
            }
        }
        if (cloneEligible) queuePair(target, target);

        try {
            for (let i = 0; i < uniquePairs.length; i++) {
                this.throwIfCancelled(isCancelled);
                const { pairKey, parent1, parent2 } = uniquePairs[i];
                if (typeof onProgress === 'function') {
                    onProgress({
                        phase: 'layouts',
                        current: i + 1,
                        total: uniquePairs.length
                    });
                }
                let layouts = this.collapseEquivalentLayouts(
                    await this.generateLayoutsAsync(parent1, parent2, target, isCancelled)
                );
                const isClonePair = this.flowerKey(parent1) === this.flowerKey(parent2)
                    && this.isGreenhouseEnabled()
                    && this.canCloneFlowerToTarget(parent1, target);
                if (isClonePair) {
                    layouts = this.tagCloneLayouts(layouts);
                }
                layoutCache.set(pairKey, layouts);
                await this.yieldCancelled(isCancelled);
            }
        } catch (err) {
            if (err && err.code === 'CAF_SEARCH_CANCELLED') {
                for (const plan of plans || []) {
                    if (plan.layoutsPending) {
                        plan.layouts = plan.layouts || [];
                        plan.layoutsPending = false;
                    }
                }
                throw err;
            }
            throw err;
        } finally {
            this._layoutAbstractCache = null;
            this._layoutExpensiveSolves = 0;
            this._layoutMaxExpensiveSolves = null;
        }

        const sharedCloneLayouts = cloneEligible
            ? (layoutCache.get(clonePairKey) || [])
            : [];

        for (const plan of plans || []) {
            const merged = [];
            const seen = new Set();
            const addLayouts = (list) => {
                for (const layout of list || []) {
                    const sig = [
                        layout.isCloneLayout ? 'c' : 'b',
                        layout.name,
                        layout.score,
                        layout.expectedCount,
                        layout.placements?.length
                    ].join('|');
                    if (seen.has(sig)) continue;
                    seen.add(sig);
                    merged.push(layout);
                }
            };

            const planPairKey = (plan.parent1 && plan.parent2)
                ? this.pairLayoutKey(plan.parent1, plan.parent2)
                : '';

            if (plan.finalParentsOnPlot && planPairKey) {
                addLayouts(layoutCache.get(planPairKey));
            } else if (plan.isClonePlan && cloneEligible) {
                addLayouts(sharedCloneLayouts);
            }

            merged.sort((a, b) => this.compareLayoutScores(a, b));

            plan.layouts = merged.slice(0, 3);
            plan.layoutsPending = false;
        }

        return plans;
    }

    /**
     * If every layout ties on outcome metrics (same odds / expected / breed cells),
     * keep a single best layout instead of listing identical alternatives.
     */
    collapseEquivalentLayouts(layouts) {
        if (!layouts || layouts.length <= 1) {
            if (layouts?.[0]) {
                layouts[0].name = this.layoutOptionName(0, { isClone: !!layouts[0].isCloneLayout });
            }
            return layouts || [];
        }

        const bySignature = [];
        const seen = new Set();
        for (const layout of layouts) {
            const sig = layout.signature || JSON.stringify(
                (layout.placements || []).map(p =>
                    `${p.row},${p.col},${this.flowerKey(p.flower)}`
                ).sort()
            );
            if (seen.has(sig)) continue;
            seen.add(sig);
            bySignature.push(layout);
        }

        if (bySignature.length <= 1) {
            if (bySignature[0]) {
                bySignature[0].name = this.layoutOptionName(0, { isClone: !!bySignature[0].isCloneLayout });
            }
            return bySignature;
        }

        const first = bySignature[0];
        const allSameOutcome = bySignature.every(l =>
            l.score === first.score &&
            (l.expectedCount || 0) === (first.expectedCount || 0) &&
            (l.breedableCells || 0) === (first.breedableCells || 0) &&
            (l.placements?.length || 0) === (first.placements?.length || 0)
        );

        if (allSameOutcome) {
            first.name = this.layoutOptionName(0, { isClone: !!first.isCloneLayout });
            return [first];
        }

        bySignature.forEach((layout, i) => {
            layout.name = this.layoutOptionName(i, { isClone: !!layout.isCloneLayout });
        });
        return bySignature;
    }

    getPlantableCells() {
        const cells = [];
        if (!this.sim.grid) return cells;
        for (let r = 0; r < this.sim.grid.length; r++) {
            for (let c = 0; c < this.sim.grid[r].length; c++) {
                const cell = this.sim.grid[r][c];
                if (!cell || cell.disabled) continue;
                if (cell.element && cell.element.classList.contains('disabled')) continue;
                cells.push({ row: r, col: c });
            }
        }
        return cells;
    }

    snapshotGridFlowers() {
        const snap = [];
        if (!this.sim.grid) return snap;
        for (let r = 0; r < this.sim.grid.length; r++) {
            for (let c = 0; c < this.sim.grid[r].length; c++) {
                const cell = this.sim.grid[r][c];
                snap.push({
                    row: r,
                    col: c,
                    flower: cell && cell.flower ? this.cloneFlower(cell.flower) : null
                });
            }
        }
        return snap;
    }

    restoreGridFlowers(snapshot) {
        snapshot.forEach(({ row, col, flower }) => {
            if (!this.sim.grid[row] || !this.sim.grid[row][col]) return;
            this.sim.grid[row][col].flower = flower ? this.cloneFlower(flower) : null;
        });
    }

    clearPlantableFlowersInMemory() {
        const cells = this.getPlantableCells();
        cells.forEach(({ row, col }) => {
            this.sim.grid[row][col].flower = null;
        });
    }

    applyPlacementsInMemory(placements) {
        placements.forEach(({ row, col, flower }) => {
            if (!this.sim.grid[row] || !this.sim.grid[row][col]) return;
            if (this.sim.grid[row][col].disabled) return;
            this.sim.grid[row][col].flower = this.cloneFlower(flower);
        });
    }

    /**
     * Build adjacency among plantable cells (8-directional), as index lists.
     */
    buildPlantableGraph(cells) {
        const indexOf = new Map();
        cells.forEach((cell, i) => indexOf.set(`${cell.row},${cell.col}`, i));

        return cells.map((cell) => {
            const neighbors = [];
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const key = `${cell.row + dr},${cell.col + dc}`;
                    if (indexOf.has(key)) {
                        neighbors.push(indexOf.get(key));
                    }
                }
            }
            return neighbors;
        });
    }

    /**
     * Precompute P(target | n1 adjacent parent1, n2 adjacent parent2) using the real
     * breeding engine. With only two parent identities, pair outcomes depend only on counts.
     */
    buildTargetProbabilityLut(parent1, parent2, target) {
        const lut = Array.from({ length: 9 }, () => new Float64Array(9));
        const same = this.flowerKey(parent1) === this.flowerKey(parent2);

        // Use real Greenhouse toggle so single-parent vs pair clone odds match the game
        return this.withLayoutBreedContext(() => {
            const snapshot = this.snapshotGridFlowers();
            const savedGrid = this.sim.grid;
            const savedSize = this.sim.gridSize;
            const savedCols = this.sim.gridSizeCols;

            try {
                // Temporary 3x3 in-memory grid for LUT samples
                this.sim.gridSize = 3;
                this.sim.gridSizeCols = 3;
                this.sim.grid = Array.from({ length: 3 }, (_, r) =>
                    Array.from({ length: 3 }, (_, c) => ({
                        flower: null,
                        disabled: false,
                        element: {
                            classList: {
                                contains: () => false,
                                add() {},
                                remove() {}
                            },
                            innerHTML: ''
                        },
                        row: r,
                        col: c
                    }))
                );

                const ring = [
                    [0, 0], [0, 1], [0, 2],
                    [1, 0],         [1, 2],
                    [2, 0], [2, 1], [2, 2]
                ];

                for (let n1 = 0; n1 <= 8; n1++) {
                    for (let n2 = 0; n2 <= 8 - n1; n2++) {
                        for (let r = 0; r < 3; r++) {
                            for (let c = 0; c < 3; c++) {
                                this.sim.grid[r][c].flower = null;
                            }
                        }

                        let placed = 0;
                        for (let k = 0; k < n1; k++) {
                            const [r, c] = ring[placed++];
                            this.sim.grid[r][c].flower = this.cloneFlower(parent1);
                        }
                        for (let k = 0; k < n2; k++) {
                            const [r, c] = ring[placed++];
                            this.sim.grid[r][c].flower = this.cloneFlower(same ? parent1 : parent2);
                        }

                        const possibilities = this.sim.calculateCellPossibilities(1, 1) || [];
                        const match = possibilities.find(p =>
                            p.type === target.type &&
                            p.color === target.mainColor &&
                            (p.pattern || 'None') === (target.pattern || 'None') &&
                            (p.secondaryColor || 'None') === (target.secondaryColor || 'None')
                        );
                        lut[n1][n2] = match
                            ? Math.min(1, Math.max(0, (match.probability || 0) / 100))
                            : 0;
                    }
                }
            } finally {
                this.sim.grid = savedGrid;
                this.sim.gridSize = savedSize;
                this.sim.gridSizeCols = savedCols;
                this.restoreGridFlowers(snapshot);
            }

            let maxP = 0;
            for (let a = 0; a <= 8; a++) {
                for (let b = 0; b <= 8; b++) {
                    if (lut[a][b] > maxP) maxP = lut[a][b];
                }
            }
            return { lut, same, maxP };
        });
    }

    scoreStateExact(state, neighborIdx, lut, parentsDifferent) {
        let has1 = false;
        let has2 = false;
        for (let i = 0; i < state.length; i++) {
            if (state[i] === 1) has1 = true;
            else if (state[i] === 2) has2 = true;
        }
        if (parentsDifferent) {
            if (!has1 || !has2) {
                return { score: -1, expectedCount: 0, breedableCells: 0 };
            }
        } else if (!has1 && !has2) {
            return { score: -1, expectedCount: 0, breedableCells: 0 };
        }

        let expected = 0;
        let breedable = 0;
        let probNone = 1;

        for (let i = 0; i < state.length; i++) {
            if (state[i] !== 0) continue;
            let n1 = 0;
            let n2 = 0;
            const neigh = neighborIdx[i];
            for (let k = 0; k < neigh.length; k++) {
                const v = state[neigh[k]];
                if (v === 1) n1++;
                else if (v === 2) n2++;
            }
            const p = lut[n1][n2];
            if (p > 0) {
                expected += p;
                breedable += 1;
                probNone *= (1 - p);
            }
        }

        return {
            score: 1 - probNone,
            expectedCount: expected,
            breedableCells: breedable
        };
    }

    /** Precompute max lut[n1+a][n2+b] for a+b <= free (a,b >= 0). */
    buildMaxLutGivenFree(lut) {
        const maxFree = 8;
        const table = Array.from({ length: 9 }, () =>
            Array.from({ length: 9 }, () => new Float64Array(maxFree + 1))
        );
        for (let n1 = 0; n1 <= 8; n1++) {
            for (let n2 = 0; n2 <= 8; n2++) {
                for (let free = 0; free <= maxFree; free++) {
                    let best = lut[Math.min(8, n1)][Math.min(8, n2)];
                    for (let a = 0; a <= free; a++) {
                        for (let b = 0; b <= free - a; b++) {
                            const p = lut[Math.min(8, n1 + a)][Math.min(8, n2 + b)];
                            if (p > best) best = p;
                        }
                    }
                    table[n1][n2][free] = best;
                }
            }
        }
        return table;
    }

    compareLayoutScores(a, b) {
        if (b.score !== a.score) return b.score - a.score;
        if ((b.expectedCount || 0) !== (a.expectedCount || 0)) {
            return (b.expectedCount || 0) - (a.expectedCount || 0);
        }
        return (b.breedableCells || 0) - (a.breedableCells || 0);
    }

    considerTopLayout(top, candidate, limit = 3) {
        if (!candidate || candidate.score < 0) return;
        // Deduplicate identical placement signatures
        const sig = candidate.signature;
        if (top.some(t => t.signature === sig)) return;

        top.push(candidate);
        top.sort((a, b) => this.compareLayoutScores(a, b));
        if (top.length > limit) top.length = limit;
    }

    /**
     * Seed patterns used ONLY as B&B incumbents (initial lower bounds).
     * Never returned as the final answer unless the exact search confirms them.
     */
    seedIncumbentStates(cells, parentsDifferent) {
        const n = cells.length;
        const patterns = [
            (cell) => {
                const col = cell.col;
                if (col % 4 === 0) return 1;
                if (col % 4 === 2) return parentsDifferent ? 2 : 1;
                return 0;
            },
            (cell) => {
                const row = cell.row;
                if (row % 4 === 0) return 1;
                if (row % 4 === 2) return parentsDifferent ? 2 : 1;
                return 0;
            },
            (cell) => {
                const parity = (cell.row + cell.col) & 1;
                if (parity === 0) return 0;
                return ((cell.row + Math.floor(cell.col / 2)) & 1) ? 1 : (parentsDifferent ? 2 : 1);
            },
            (cell) => {
                const v = (cell.row + cell.col) & 1;
                if (v === 0) return 1;
                return parentsDifferent ? 2 : 0;
            },
            (cell) => {
                const r = cell.row & 1;
                const c = cell.col & 1;
                if (r === 0 && c === 0) return 1;
                if (r === 0 && c === 1) return parentsDifferent ? 2 : 1;
                return 0;
            }
        ];

        // Greenhouse patterned clones prefer exactly 1 neighbor (20% vs 1% for 2+).
        // Seed a sparse every-other-cell lattice for same-parent search.
        if (!parentsDifferent) {
            patterns.push((cell) => ((cell.row + cell.col * 2) % 5 === 0 ? 1 : 0));
            patterns.push((cell) => (cell.row % 3 === 1 && cell.col % 3 === 1 ? 1 : 0));
        }

        return patterns.map((fn) => {
            const state = new Uint8Array(n);
            for (let i = 0; i < n; i++) state[i] = fn(cells[i], i);
            return state;
        });
    }

    stateToLayout(state, cells, parent1, parent2, metrics, exact) {
        const placements = [];
        for (let i = 0; i < cells.length; i++) {
            if (state[i] === 1) {
                placements.push({
                    row: cells[i].row,
                    col: cells[i].col,
                    flower: this.cloneFlower(parent1)
                });
            } else if (state[i] === 2) {
                placements.push({
                    row: cells[i].row,
                    col: cells[i].col,
                    flower: this.cloneFlower(parent2)
                });
            }
        }
        return {
            name: this.layoutOptionName(0),
            placements,
            score: metrics.score,
            expectedCount: metrics.expectedCount,
            breedableCells: metrics.breedableCells,
            signature: Array.from(state).join(''),
            exact
        };
    }

    /**
     * Exact global optimum for P(≥1 target). Uses row DP on typical grids (incl. 5×5);
     * falls back to branch-and-bound with tight bounds. Seeds only tighten the incumbent.
     */
    async findExactOptimalLayoutsAsync(parent1, parent2, target, cells, isCancelled = null, precomputed = null) {
        const n = cells.length;
        if (n < 2) return [];
        this.throwIfCancelled(isCancelled);

        const { lut, same, maxP } = precomputed || this.buildTargetProbabilityLut(parent1, parent2, target);
        if (maxP <= 0) return [];

        const parentsDifferent = !same;
        const keepTop = n <= 12 ? 3 : 1;

        const rowDp = await this.findExactOptimalLayoutsRowDp(
            parent1, parent2, cells, lut, parentsDifferent, keepTop, isCancelled
        );
        if (rowDp) return rowDp;

        return this.findExactOptimalLayoutsBandB(
            parent1, parent2, cells, lut, maxP, parentsDifferent, keepTop, isCancelled
        );
    }

    /**
     * Exact optimum via DP over row configurations. Returns null if the plantable
     * shape is too wide / irregular for this method.
     */
    async findExactOptimalLayoutsRowDp(parent1, parent2, cells, lut, parentsDifferent, keepTop, isCancelled = null) {
        const n = cells.length;
        const base = parentsDifferent ? 3 : 2;

        // Build both row-major and column-major line decompositions; pick the narrower
        // axis so more plots stay in DP (e.g. wide rows / skinny columns).
        const buildAxis = (useCols) => {
            const axisMap = new Map();
            for (let i = 0; i < n; i++) {
                const axis = useCols ? cells[i].col : cells[i].row;
                const cross = useCols ? cells[i].row : cells[i].col;
                if (!axisMap.has(axis)) axisMap.set(axis, []);
                axisMap.get(axis).push({ col: cross, idx: i });
            }
            const axisNums = [...axisMap.keys()].sort((a, b) => a - b);
            const slots = axisNums.map((r) => {
                const arr = axisMap.get(r);
                arr.sort((a, b) => a.col - b.col);
                return arr;
            });
            const widths = slots.map((s) => s.length);
            const maxW = widths.length ? Math.max(...widths) : 0;
            return { axisNums, slots, widths, maxW };
        };

        const byRow = buildAxis(false);
        const byCol = buildAxis(true);
        const chosen = (byCol.maxW < byRow.maxW) ? byCol : byRow;
        const { axisNums: rowNums, slots, widths, maxW } = chosen;
        if (!rowNums.length) return [];

        // Per-line configs: base^maxW. DP state is ~configs² and each layer does
        // ~configs³ transitions — so 3^6 (=729) is NOT interactive (mm9 is 6-wide
        // on the row axis ≈ 387M transitions/layer). Cap so ternary lines stay ≤4
        // wide (81) and binary (same-parent) can still use up to width 6 (64).
        const lineConfigs = base ** maxW;
        if (lineConfigs > 100) return null;

        const colPos = slots.map((s) => {
            const m = new Map();
            s.forEach((slot, j) => m.set(slot.col, j));
            return m;
        });
        const rowIndexByNum = new Map(rowNums.map((r, i) => [r, i]));

        const decoded = widths.map((w) => {
            const count = base ** w;
            const arr = new Array(count);
            for (let cfg = 0; cfg < count; cfg++) {
                const vals = new Uint8Array(w);
                let x = cfg;
                for (let j = 0; j < w; j++) {
                    vals[j] = x % base;
                    x = (x / base) | 0;
                }
                arr[cfg] = vals;
            }
            return arr;
        });

        const flagsOf = (vals) => {
            let has1 = false;
            let has2 = false;
            for (let j = 0; j < vals.length; j++) {
                if (vals[j] === 1) has1 = true;
                else if (vals[j] === 2) has2 = true;
            }
            if (!parentsDifferent) return has1 ? 3 : 0;
            return (has1 ? 1 : 0) | (has2 ? 2 : 0);
        };

        /**
         * Score empty cells in line ri. `valsByRowIdx` maps line-index → decoded values
         * for any plantable lines that may neighbor this line.
         */
        const scoreRow = (ri, valsByRowIdx) => {
            let factor = 1;
            let expected = 0;
            let breedable = 0;
            const rowNum = rowNums[ri];
            const rowSlots = slots[ri];
            const curr = valsByRowIdx[ri];

            for (let j = 0; j < rowSlots.length; j++) {
                if (curr[j] !== 0) continue;
                const col = rowSlots[j].col;
                let n1 = 0;
                let n2 = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const rIdx = rowIndexByNum.get(rowNum + dr);
                        if (rIdx === undefined) continue;
                        const vals = valsByRowIdx[rIdx];
                        if (!vals) continue;
                        const jj = colPos[rIdx].get(col + dc);
                        if (jj === undefined) continue;
                        const nv = vals[jj];
                        if (nv === 1) n1++;
                        else if (nv === 2) n2++;
                    }
                }
                const p = lut[n1][n2];
                if (p > 0) {
                    factor *= (1 - p);
                    expected += p;
                    breedable += 1;
                }
            }
            return { factor, expected, breedable };
        };

        // String keys support up to 3^7 configs (bit-packing was limited to ≤243).
        const packKey = (prev, curr, flags) => `${prev}|${curr}|${flags}`;
        const unpackPrev = (key) => {
            const a = key.indexOf('|');
            return parseInt(key.slice(0, a), 10);
        };
        const unpackCurr = (key) => {
            const a = key.indexOf('|');
            const b = key.indexOf('|', a + 1);
            return parseInt(key.slice(a + 1, b), 10);
        };
        const unpackFlags = (key) => {
            const b = key.lastIndexOf('|');
            return parseInt(key.slice(b + 1), 10);
        };

        // DP after assigning lines 0..i: minimize probNone for finalized lines.
        // Store parent pointers instead of full paths (huge win on 5×5).
        let dp = new Map();
        const n0 = decoded[0].length;
        for (let c0 = 0; c0 < n0; c0++) {
            const f = flagsOf(decoded[0][c0]);
            dp.set(packKey(-1, c0, f), {
                probNone: 1,
                expected: 0,
                breedable: 0,
                choice: c0,
                parent: null
            });
        }

        const R = rowNums.length;
        const valsScratch = {};
        for (let i = 1; i < R; i++) {
            const nextDp = new Map();
            const nCfg = decoded[i].length;
            const decPrevPrev = i >= 2 ? decoded[i - 2] : null;
            const decPrev = decoded[i - 1];
            const decCurr = decoded[i];
            let steps = 0;

            for (const [key, rec] of dp) {
                const prevCfg = unpackPrev(key);
                const currCfg = unpackCurr(key);
                const flags = unpackFlags(key);
                const prevVals = decPrev[currCfg];

                for (let nc = 0; nc < nCfg; nc++) {
                    valsScratch[i - 1] = prevVals;
                    valsScratch[i] = decCurr[nc];
                    if (decPrevPrev && prevCfg >= 0) valsScratch[i - 2] = decPrevPrev[prevCfg];
                    else delete valsScratch[i - 2];

                    const scored = scoreRow(i - 1, valsScratch);
                    const probNone = rec.probNone * scored.factor;
                    const expected = rec.expected + scored.expected;
                    const breedable = rec.breedable + scored.breedable;
                    const newFlags = flags | flagsOf(decCurr[nc]);
                    const newKey = packKey(currCfg, nc, newFlags);

                    const prevBest = nextDp.get(newKey);
                    if (!prevBest || probNone < prevBest.probNone - 1e-15 ||
                        (Math.abs(probNone - prevBest.probNone) <= 1e-15 && expected > prevBest.expected)) {
                        nextDp.set(newKey, {
                            probNone,
                            expected,
                            breedable,
                            choice: nc,
                            parent: rec
                        });
                    }
                }

                steps += nCfg;
                if (steps >= 80000) {
                    steps = 0;
                    await this.yieldCancelled(isCancelled);
                }
            }
            dp = nextDp;
            this.throwIfCancelled(isCancelled);
        }

        const rebuildPath = (rec) => {
            const path = [];
            let cur = rec;
            while (cur) {
                path.push(cur.choice);
                cur = cur.parent;
            }
            path.reverse();
            return path;
        };

        // Finalize last row and keep the best few complete layouts
        const top = [];
        const seen = new Set();
        const consider = (state, score, expected, breedable) => {
            const signature = Array.from(state).join('');
            if (seen.has(signature)) return;
            const candidate = {
                state,
                score,
                expectedCount: expected,
                breedableCells: breedable,
                signature
            };
            // Insert sorted
            let placed = false;
            for (let t = 0; t < top.length; t++) {
                const cur = top[t];
                const better = score > cur.score + 1e-15 ||
                    (Math.abs(score - cur.score) <= 1e-15 && expected > cur.expectedCount) ||
                    (Math.abs(score - cur.score) <= 1e-15 &&
                        Math.abs(expected - cur.expectedCount) <= 1e-15 &&
                        breedable > cur.breedableCells);
                if (better) {
                    top.splice(t, 0, candidate);
                    placed = true;
                    break;
                }
            }
            if (!placed) top.push(candidate);
            seen.add(signature);
            while (top.length > keepTop) {
                const dropped = top.pop();
                seen.delete(dropped.signature);
            }
        };

        for (const [key, rec] of dp) {
            const flags = unpackFlags(key);
            if (parentsDifferent) {
                if ((flags & 3) !== 3) continue;
            } else if (!flags) {
                continue;
            }

            const path = rebuildPath(rec);
            if (path.length !== R) continue;
            const assignedVals = {};
            for (let ri = 0; ri < R; ri++) assignedVals[ri] = decoded[ri][path[ri]];

            let probNone;
            let expected;
            let breedable;
            if (R === 1) {
                const scored = scoreRow(0, assignedVals);
                probNone = scored.factor;
                expected = scored.expected;
                breedable = scored.breedable;
            } else {
                const scored = scoreRow(R - 1, assignedVals);
                probNone = rec.probNone * scored.factor;
                expected = rec.expected + scored.expected;
                breedable = rec.breedable + scored.breedable;
            }

            const state = new Uint8Array(n);
            for (let ri = 0; ri < R; ri++) {
                const vals = decoded[ri][path[ri]];
                for (let j = 0; j < slots[ri].length; j++) {
                    state[slots[ri][j].idx] = vals[j];
                }
            }
            consider(state, 1 - probNone, expected, breedable);
        }

        if (!top.length) return [];

        return top.map((item, i) => {
            const layout = this.stateToLayout(
                item.state,
                cells,
                parent1,
                parent2,
                {
                    score: item.score,
                    expectedCount: item.expectedCount,
                    breedableCells: item.breedableCells
                },
                true
            );
            layout.name = this.layoutOptionName(i);
            return layout;
        });
    }

    /**
     * Exact B&B fallback when row DP can't apply. Seeds only for pruning.
     * On large plots, a node/time budget returns the best incumbent found so far
     * (still usually strong) instead of hanging for minutes.
     */
    async findExactOptimalLayoutsBandB(parent1, parent2, cells, lut, maxP, parentsDifferent, keepTop, isCancelled = null) {
        const n = cells.length;
        const neighborIdx = this.buildPlantableGraph(cells);
        const maxLutFree = this.buildMaxLutGivenFree(lut);
        const top = [];
        const startedAt = (typeof performance !== 'undefined' && performance.now)
            ? performance.now()
            : Date.now();
        // ~3s / 250k nodes keeps large plots usable; small plots usually finish earlier.
        const maxNodes = n <= 20 ? Infinity : (n <= 36 ? 400000 : 250000);
        const maxMs = n <= 20 ? Infinity : (n <= 36 ? 4000 : 2500);

        const considerState = (state) => {
            const metrics = this.scoreStateExact(state, neighborIdx, lut, parentsDifferent);
            if (metrics.score < 0) return;
            const candidate = this.stateToLayout(state, cells, parent1, parent2, metrics, true);
            this.considerTopLayout(top, candidate, keepTop);
        };

        this.seedIncumbentStates(cells, parentsDifferent).forEach(considerState);

        const order = Array.from({ length: n }, (_, i) => i);
        order.sort((a, b) => neighborIdx[b].length - neighborIdx[a].length);

        const choices = parentsDifferent ? [1, 2, 0] : [1, 0];
        const state = new Uint8Array(n);
        const stack = [{ depth: 0, choiceIdx: 0, has1: false, has2: false }];
        let nodes = 0;
        const chunkNodes = 12000;
        let finished = true;

        const pruneThreshold = () => {
            if (!top.length) return -1;
            if (keepTop === 1) return top[0].score;
            return top.length >= keepTop ? top[keepTop - 1].score : -1;
        };

        const timedOut = () => {
            const now = (typeof performance !== 'undefined' && performance.now)
                ? performance.now()
                : Date.now();
            return (now - startedAt) >= maxMs || nodes >= maxNodes;
        };

        while (stack.length) {
            if (timedOut()) {
                finished = false;
                break;
            }

            const chunkStart = nodes;
            while (stack.length && nodes - chunkStart < chunkNodes) {
                if (nodes >= maxNodes) {
                    finished = false;
                    stack.length = 0;
                    break;
                }

                const frame = stack[stack.length - 1];

                if (frame.depth === n) {
                    if ((!parentsDifferent && frame.has1) ||
                        (parentsDifferent && frame.has1 && frame.has2)) {
                        considerState(state);
                    }
                    stack.pop();
                    continue;
                }

                const cellIdx = order[frame.depth];
                const remaining = n - frame.depth;

                if (parentsDifferent) {
                    if (!frame.has1 && !frame.has2 && remaining < 2) {
                        stack.pop();
                        nodes += 1;
                        continue;
                    }
                    if ((!frame.has1 || !frame.has2) && remaining < 1) {
                        stack.pop();
                        nodes += 1;
                        continue;
                    }
                } else if (!frame.has1 && remaining < 1) {
                    stack.pop();
                    nodes += 1;
                    continue;
                }

                if (frame.choiceIdx === 0 && top.length >= keepTop) {
                    const thresh = pruneThreshold();
                    const ub = this.upperBoundOrdered(
                        state, frame.depth, order, neighborIdx, maxLutFree
                    );
                    if (ub <= thresh + 1e-15) {
                        state[cellIdx] = 0;
                        stack.pop();
                        nodes += 1;
                        continue;
                    }
                }

                if (frame.choiceIdx >= choices.length) {
                    state[cellIdx] = 0;
                    stack.pop();
                    continue;
                }

                const choice = choices[frame.choiceIdx];
                frame.choiceIdx += 1;
                state[cellIdx] = choice;
                nodes += 1;
                stack.push({
                    depth: frame.depth + 1,
                    choiceIdx: 0,
                    has1: frame.has1 || choice === 1,
                    has2: frame.has2 || choice === 2 || (!parentsDifferent && choice === 1)
                });
            }

            if (stack.length) {
                await this.yieldCancelled(isCancelled);
            }
        }

        top.forEach((layout, i) => {
            layout.name = this.layoutOptionName(i);
            layout.exact = finished;
        });

        return top;
    }

    /**
     * Tight upper bound on P(≥1) with cells decided in order[0..depth).
     * Uses optimistic free-neighbor fill (no maxP inflation) and min(prod, sum).
     */
    upperBoundOrdered(state, depth, order, neighborIdx, maxLutFree) {
        const n = state.length;
        const decided = new Uint8Array(n);
        for (let d = 0; d < depth; d++) decided[order[d]] = 1;

        let probNone = 1;
        let sumP = 0;

        for (let i = 0; i < n; i++) {
            if (decided[i] && state[i] !== 0) continue;

            let n1 = 0;
            let n2 = 0;
            let free = 0;
            const neigh = neighborIdx[i];
            for (let k = 0; k < neigh.length; k++) {
                const j = neigh[k];
                if (decided[j]) {
                    if (state[j] === 1) n1++;
                    else if (state[j] === 2) n2++;
                } else {
                    free++;
                }
            }
            // Cap free to table size
            if (free > 8) free = 8;

            const best = maxLutFree[Math.min(8, n1)][Math.min(8, n2)][free];
            if (best > 0) {
                probNone *= (1 - best);
                sumP += best;
            }
        }

        const prodBound = 1 - probNone;
        const sumBound = sumP >= 1 ? 1 : sumP;
        return prodBound < sumBound ? prodBound : sumBound;
    }

    /**
     * Canonical parent order for layout solving/caching: patterned first when mixed,
     * otherwise stable flowerKey order. Keeps LUTs comparable across plan variants.
     */
    canonicalizeLayoutParents(parent1, parent2) {
        const p1Pat = (parent1.pattern || 'None') !== 'None';
        const p2Pat = (parent2.pattern || 'None') !== 'None';
        if (p1Pat !== p2Pat) {
            return p1Pat
                ? { p1: parent1, p2: parent2, swapped: false }
                : { p1: parent2, p2: parent1, swapped: true };
        }
        if (this.flowerKey(parent1) <= this.flowerKey(parent2)) {
            return { p1: parent1, p2: parent2, swapped: false };
        }
        return { p1: parent2, p2: parent1, swapped: true };
    }

    swapLayoutSignatureRoles(signature) {
        if (!signature) return signature;
        let out = '';
        for (let i = 0; i < signature.length; i++) {
            const ch = signature[i];
            out += ch === '1' ? '2' : (ch === '2' ? '1' : ch);
        }
        return out;
    }

    async generateLayoutsAsync(parent1, parent2, target, isCancelled = null) {
        const cells = this.getPlantableCells();
        if (cells.length < 2) return [];
        this.throwIfCancelled(isCancelled);

        // Preserve effect list across long async solves (re-entrant loads / other code)
        const savedEffects = Array.isArray(this.sim.patternNoSecondaries)
            ? this.sim.patternNoSecondaries.slice()
            : null;

        try {
            // Canonicalize so Rose Ring+BB and BB+Rose Ring share one LUT/geometry solve.
            const { p1, p2, swapped } = this.canonicalizeLayoutParents(parent1, parent2);

            // Shared across attachExactLayouts: identical LUTs reuse geometry.
            const precomputed = this.buildTargetProbabilityLut(p1, p2, target);
            if (precomputed.maxP <= 0) return [];
            const lutKey = this.fingerprintLut(precomputed.lut, precomputed.same);
            if (this._layoutAbstractCache && this._layoutAbstractCache.has(lutKey)) {
                const abstracts = this._layoutAbstractCache.get(lutKey).map((abs) => (
                    swapped
                        ? { ...abs, signature: this.swapLayoutSignatureRoles(abs.signature) }
                        : abs
                ));
                return this.materializeAbstractLayouts(abstracts, parent1, parent2, cells);
            }

            if (
                this._layoutAbstractCache
                && this._layoutMaxExpensiveSolves != null
                && (this._layoutExpensiveSolves || 0) >= this._layoutMaxExpensiveSolves
            ) {
                // Skip additional distinct LUT solves on huge plots — recipes still show.
                return [];
            }
            if (this._layoutAbstractCache && this._layoutMaxExpensiveSolves != null) {
                this._layoutExpensiveSolves = (this._layoutExpensiveSolves || 0) + 1;
            }

            const neighborIdx = this.buildPlantableGraph(cells);
            const components = this.getConnectedComponents(cells.length, neighborIdx);
            let layouts;

            // Disconnected plantable regions are independent — union of per-component optima
            if (components.length > 1) {
                const mergedPlacements = [];
                let probNone = 1;
                let expectedCount = 0;
                let breedableCells = 0;
                let allExact = true;

                for (const compIdxs of components) {
                    this.throwIfCancelled(isCancelled);
                    if (compIdxs.length < 2) continue;
                    const subCells = compIdxs.map(i => cells[i]);
                    const compLayouts = await this.findExactOptimalLayoutsAsync(
                        p1, p2, target, subCells, isCancelled, precomputed
                    );
                    if (!compLayouts.length) continue;
                    const best = compLayouts[0];
                    mergedPlacements.push(...best.placements);
                    probNone *= (1 - (best.score || 0));
                    expectedCount += best.expectedCount || 0;
                    breedableCells += best.breedableCells || 0;
                    if (!best.exact) allExact = false;
                    await this.yieldCancelled(isCancelled);
                }

                if (!mergedPlacements.length) return [];

                // Rebuild a full-grid signature for LUT caching / rematerialization
                const fullState = new Uint8Array(cells.length);
                const indexOf = new Map(cells.map((c, i) => [`${c.row},${c.col}`, i]));
                for (const p of mergedPlacements) {
                    const idx = indexOf.get(`${p.row},${p.col}`);
                    if (idx === undefined) continue;
                    if (this.flowerKey(p.flower) === this.flowerKey(p1)) fullState[idx] = 1;
                    else if (this.flowerKey(p.flower) === this.flowerKey(p2)) fullState[idx] = 2;
                }

                layouts = [{
                    name: this.layoutOptionName(0),
                    placements: mergedPlacements,
                    score: 1 - probNone,
                    expectedCount,
                    breedableCells,
                    exact: allExact,
                    signature: Array.from(fullState).join('')
                }];
            } else {
                layouts = await this.findExactOptimalLayoutsAsync(
                    p1, p2, target, cells, isCancelled, precomputed
                );
            }

            if (this._layoutAbstractCache) {
                const abstracts = this.toAbstractLayouts(layouts);
                if (abstracts.length) this._layoutAbstractCache.set(lutKey, abstracts);
            }

            if (swapped) {
                // Rematerialize into the caller's parent1/parent2 roles
                const abstracts = this.toAbstractLayouts(layouts).map((abs) => ({
                    ...abs,
                    signature: this.swapLayoutSignatureRoles(abs.signature)
                }));
                return this.materializeAbstractLayouts(abstracts, parent1, parent2, cells);
            }
            // Ensure returned layouts use the original parent objects when not swapped
            if (p1 !== parent1 || p2 !== parent2) {
                return this.materializeAbstractLayouts(
                    this.toAbstractLayouts(layouts),
                    parent1,
                    parent2,
                    cells
                );
            }
            return layouts;
        } finally {
            if (savedEffects) this.sim.patternNoSecondaries = savedEffects;
        }
    }

    getConnectedComponents(n, neighborIdx) {
        const seen = new Uint8Array(n);
        const comps = [];
        for (let i = 0; i < n; i++) {
            if (seen[i]) continue;
            const stack = [i];
            const comp = [];
            seen[i] = 1;
            while (stack.length) {
                const u = stack.pop();
                comp.push(u);
                const neigh = neighborIdx[u];
                for (let k = 0; k < neigh.length; k++) {
                    const v = neigh[k];
                    if (!seen[v]) {
                        seen[v] = 1;
                        stack.push(v);
                    }
                }
            }
            comps.push(comp);
        }
        return comps;
    }
}

// Expose globally for script.js
window.FlowerPlanSolver = FlowerPlanSolver;
