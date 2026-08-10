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
            if (prevEffects) this.sim.patternNoSecondaries = prevEffects;
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
            if (prevEffects) this.sim.patternNoSecondaries = prevEffects;
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

        return [...types].sort((a, b) => {
            const sa =
                (defaultColor.has(a) ? 2 : 0) +
                (defaultPattern.has(a) ? 4 : 0) +
                (this.canUseType(a) ? 6 : 0);
            const sb =
                (defaultColor.has(b) ? 2 : 0) +
                (defaultPattern.has(b) ? 4 : 0) +
                (this.canUseType(b) ? 6 : 0);
            return sb - sa;
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

        // Effects (Glow/Cosmic/…): only donors that naturally get that effect — full cross-type
        // search freezes the browser verifying hundreds of useless pairs.
        if (isEffect) {
            const nativeEffectDonors = donorTypes.filter(
                t => this.getDefaultPatternForType(t) === pattern
            );
            donorTypes = nativeEffectDonors.length
                ? nativeEffectDonors
                : donorTypes.slice(0, 4);
        }

        // Pattern transfer / mutation first — avoid filling the verify budget with chicken-egg self pairs
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

        // Same-type color mix reverse
        const mixParents = reverseMix[color] || [];
        mixParents.forEach(([c1, c2]) => {
            this.addCandidate(candidates, seen, this.solid(type, c1), this.solid(type, c2));
            if (isPatterned) {
                this.addCandidate(candidates, seen, this.patterned(type, c1, pattern, c2), this.solid(type, c2));
                this.addCandidate(candidates, seen, this.patterned(type, c1, pattern, secondary), this.solid(type, c2));
            }
        });

        // Patterned color-mix residual paths
        if (isPatterned && !isEffect) {
            this.addCandidate(candidates, seen, this.patterned(type, color, pattern, secondary), this.solid(type, secondary));
            this.addCandidate(
                candidates,
                seen,
                this.patterned(type, color, pattern, secondary),
                this.patterned(type, secondary, pattern, color)
            );
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
                // Prefer cross-type donors over needing the target itself as a parent
                if (tKey) {
                    if (this.flowerKey(pair[0]) === tKey || this.flowerKey(pair[1]) === tKey) s -= 5;
                    if (pair[0].type !== pair[1].type) s += 2;
                    if (target && pair[0].pattern === target.pattern && pair[0].type !== target.type) s += 2;
                    if (target && pair[1].pattern === target.pattern && pair[1].type !== target.type) s += 2;
                }
                return s;
            };
            return scorePair(b) - scorePair(a);
        });
    }

    isChickenEggPair(parent1, parent2, target, terminals) {
        if (!target || this.isKnownOwned(target, terminals)) return false;
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
        const verifyCap = this.maxPairsPerFlower * 3;

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
                if (pair.parent1.type !== pair.parent2.type) s += 1;
                if (pair.parent1.type !== target.type && pair.parent1.pattern === (target.pattern || 'None')) s += 2;
                if (pair.parent2.type !== target.type && pair.parent2.pattern === (target.pattern || 'None')) s += 2;
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

        // Prefer native fertilize, on-plot finals, fewer steps, higher odds
        return (
            defaultFertilizeBonus +
            onPlotFinalBonus +
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
                if (this._verifyCount >= this.maxVerifyBudget && plans.length > 0) break;

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

                // Shortest parent chains first so 1-step finals aren't crowded out of maxPlans
                plans1 = [...plans1].sort((a, b) => a.length - b.length);
                plans2 = [...plans2].sort((a, b) => a.length - b.length);

                // Limit combinations per pair
                const limit1 = Math.min(plans1.length, 4);
                const limit2 = Math.min(plans2.length, 4);

                for (let i = 0; i < limit1; i++) {
                    for (let j = 0; j < limit2; j++) {
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

        // Collapse near-duplicate fertilize recipes (same solid, different assumed donors)
        const deduped = [];
        const seenFert = new Set();
        for (const plan of plans) {
            if (!plan.endsWithFertilize) {
                deduped.push(plan);
                continue;
            }
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
    async findExactOptimalLayoutsAsync(parent1, parent2, target, cells, isCancelled = null) {
        const n = cells.length;
        if (n < 2) return [];
        this.throwIfCancelled(isCancelled);

        const { lut, same, maxP } = this.buildTargetProbabilityLut(parent1, parent2, target);
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

        const rowMap = new Map();
        for (let i = 0; i < n; i++) {
            const { row, col } = cells[i];
            if (!rowMap.has(row)) rowMap.set(row, []);
            rowMap.get(row).push({ col, idx: i });
        }
        const rowNums = [...rowMap.keys()].sort((a, b) => a - b);
        if (!rowNums.length) return [];

        const slots = rowNums.map((r) => {
            const arr = rowMap.get(r);
            arr.sort((a, b) => a.col - b.col);
            return arr;
        });
        const widths = slots.map((s) => s.length);
        const maxW = Math.max(...widths);
        // 3^5=243 keeps DP responsive; wider rows fall back to B&B
        if (base ** maxW > 243) return null;

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
         * Score empty cells in row ri. `valsByRowIdx` maps row-index → decoded values
         * for any plantable rows that may neighbor this row.
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

        // Pack key: prevCfg in high bits may be -1 → use (prev+1)
        // key = ((prev+1) << 20) | (curr << 8) | flags  — curr fits in 8 bits for ≤243
        const packKey = (prev, curr, flags) => ((prev + 1) << 20) | (curr << 8) | flags;
        const unpackPrev = (key) => ((key >>> 20) - 1);
        const unpackCurr = (key) => (key >>> 8) & 0xfff;
        const unpackFlags = (key) => key & 0xff;

        // DP after assigning rows 0..i: minimize probNone for finalized rows.
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
            const { signature, ...rest } = layout;
            return rest;
        });
    }

    /**
     * Exact B&B fallback when row DP can't apply. Seeds only for pruning.
     */
    async findExactOptimalLayoutsBandB(parent1, parent2, cells, lut, maxP, parentsDifferent, keepTop, isCancelled = null) {
        const n = cells.length;
        const neighborIdx = this.buildPlantableGraph(cells);
        const maxLutFree = this.buildMaxLutGivenFree(lut);
        const top = [];

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

        const pruneThreshold = () => {
            if (!top.length) return -1;
            if (keepTop === 1) return top[0].score;
            return top.length >= keepTop ? top[keepTop - 1].score : -1;
        };

        while (stack.length) {
            const chunkStart = nodes;
            while (stack.length && nodes - chunkStart < chunkNodes) {
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
            layout.exact = true;
        });

        return top.map(({ signature, ...rest }) => rest);
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

    async generateLayoutsAsync(parent1, parent2, target, isCancelled = null) {
        const cells = this.getPlantableCells();
        if (cells.length < 2) return [];
        this.throwIfCancelled(isCancelled);

        // Preserve effect list across long async solves (re-entrant loads / other code)
        const savedEffects = Array.isArray(this.sim.patternNoSecondaries)
            ? this.sim.patternNoSecondaries.slice()
            : null;

        try {
            const neighborIdx = this.buildPlantableGraph(cells);
            const components = this.getConnectedComponents(cells.length, neighborIdx);

            // Disconnected plantable regions are independent — union of per-component optima
            if (components.length > 1) {
                const mergedPlacements = [];
                let probNone = 1;
                let expectedCount = 0;
                let breedableCells = 0;

                for (const compIdxs of components) {
                    this.throwIfCancelled(isCancelled);
                    if (compIdxs.length < 2) continue;
                    const subCells = compIdxs.map(i => cells[i]);
                    const layouts = await this.findExactOptimalLayoutsAsync(
                        parent1, parent2, target, subCells, isCancelled
                    );
                    if (!layouts.length) continue;
                    const best = layouts[0];
                    mergedPlacements.push(...best.placements);
                    probNone *= (1 - (best.score || 0));
                    expectedCount += best.expectedCount || 0;
                    breedableCells += best.breedableCells || 0;
                    await this.yieldCancelled(isCancelled);
                }

                if (!mergedPlacements.length) return [];

                return [{
                    name: this.layoutOptionName(0),
                    placements: mergedPlacements,
                    score: 1 - probNone,
                    expectedCount,
                    breedableCells,
                    exact: true
                }];
            }

            return this.findExactOptimalLayoutsAsync(parent1, parent2, target, cells, isCancelled);
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
