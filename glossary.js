// Glossary System
class GlossaryManager {
    constructor() {
        this.flowerData = {};
        this.flowerConfig = null;
        this._glossaryReady = null;
    }

    initializeGlossary() {
        // Initialize empty flower data - will be populated from flower config
        this.flowerData = {};

        // Load flower config first, then populate glossary
        this._glossaryReady = this.loadFlowerConfigForGlossary().then(() => {
            this.populateGlossaryFromConfig();
            this.setupGlossaryEventListeners();
            // Refresh list if glossary was opened before config finished loading
            const modal = document.getElementById('glossaryModal');
            if (modal?.classList.contains('show')) {
                this.displayGlossaryResults();
            }
        });
    }

    async ensureGlossaryReady() {
        if (!this._glossaryReady) {
            this._glossaryReady = this.loadFlowerConfigForGlossary().then(() => {
                this.populateGlossaryFromConfig();
            });
        }
        await this._glossaryReady;
    }

    // Load flower configuration for glossary
    async loadFlowerConfigForGlossary() {
        try {
            const response = await fetch('flower_config.json');
            if (response.ok) {
                this.flowerConfig = await response.json();
                console.log('Flower configuration loaded for glossary');
            } else {
                console.error('Failed to load flower configuration for glossary');
            }
        } catch (error) {
            console.error('Error loading flower configuration for glossary:', error);
        }
    }

    // Populate glossary data from flower configuration
    populateGlossaryFromConfig() {
        if (!this.flowerConfig || !this.flowerConfig.Flowers) {
            console.error('Flower configuration not loaded for glossary');
            return;
        }

        // Mapping from layout IDs to display codes
        const layoutIdToDisplayCode = {
            'sr1': 'SR', 'sr2': 'SR', 'sr3': 'SR', 'sr4': 'SR', 'sr5': 'SR', 'sr6': 'SR',
            'sr7': 'SR', 'sr8': 'SR', 'sr9': 'SR', 'sr10': 'SR', 'sr11': 'SR', 'sr12': 'SR',
            'ss1': 'SS', 'ss2': 'SS',
            'rr1': 'RR', 'rr2': 'RR',
            'gm1': 'GM', 'gm2': 'GM', 'gm3': 'GM', 'gm4': 'GM', 'gm5': 'GM', 'gm6': 'GM',
            'ww1': 'WW', 'ww2': 'WW', 'ww3': 'WW', 'ww4': 'WW',
            'ct1': 'CT',
            'mh1': 'MH', 'mh2': 'MH', 'mh3': 'MH', 'mh4': 'MH', 'mh5': 'MH', 'mh6': 'MH',
            'mh7': 'C', // Hothead Caldera
            'cc1': 'CC', // Crystal Caves
            'tm1': 'TM', // The Moon
            'ci1': 'CI', 'ci2': 'CI',
            'ip1': 'IP', // Icy Peak Summit
            'mm1': 'MM', 'mm2': 'MM', 'mm3': 'MM', 'mm4': 'MM', 'mm5': 'MM', 'mm6': 'MM',
            'mm7': 'MM', 'mm8': 'MM', 'mm9': 'MM', 'mm10': 'MM', 'mm11': 'MM' // Meadow layouts
        };

        // Mapping from location names to display codes
        const locationNameToDisplayCode = {
            'Resort': 'SR',
            'Swamp': 'SS',
            'Reef': 'RR',
            'Gemstone': 'GM',
            'Wheatflour': 'WW',
            'City': 'CT',
            'Hothead': 'MH',
            'Hothead Caldera': 'C',
            'Crystal Caves': 'CC',
            'The Moon': 'TM',
            'Cloud': 'CI',
            'Icy Peak Summit': 'IP',
            'Meadow': 'MM',
            'Greenhouse': 'G'
        };

        // Process each flower from the config
        Object.entries(this.flowerConfig.Flowers).forEach(([flowerName, flowerData]) => {
            // Convert default locations to display codes
            const locations = flowerData.default_locations ?
                flowerData.default_locations.map(loc => locationNameToDisplayCode[loc] || loc) : [];

            const compatibleLocations = flowerData.supported_locations ?
                flowerData.supported_locations.map(layoutId => layoutIdToDisplayCode[layoutId] || layoutId) : [];

            // Determine flower type based on locations
            let type = 'general';
            if (flowerData.event !== null) {
                type = 'event';
            } else if (flowerData.extreme === true) {
                type = 'extreme';
            }
            // Add Greenhouse (G) compatibility for Event and General flowers
            if (type === 'event' || type === 'general') {
                if (!compatibleLocations.includes('G')) {
                    compatibleLocations.push('G');
                }
            }

            // Get compatible patterns (supported patterns + effects)
            const compatiblePatterns = [...(flowerData.supported_patterns || [])];
            if (this.flowerConfig.Effects) {
                compatiblePatterns.push(...this.flowerConfig.Effects);
            }

            // Keep the original parent combinations
            // const parentCombinations = this.getOriginalParentCombinations(flowerName);

            this.flowerData[flowerName] = {
                type: type,
                locations: locations,
                compatibleLocations: compatibleLocations,
                defaultPattern: flowerData.default_pattern || 'None',
                compatiblePatterns: [...new Set(compatiblePatterns)], // Remove duplicates
                nativeColors: flowerData.default_colors || []
                // parentCombinations: parentCombinations
            };
        });
    }

    // Get original parent combinations for each flower
    getOriginalParentCombinations(flowerName) {
        const originalCombinations = {
            'Bellbutton': [
                'Bellbutton + Bellbutton', 'Bellbutton + Dandelily', 'Bellbutton + Penstemum', 'Bellbutton + Tulias',
                'Bellbutton + Hibiscus', 'Bellbutton + Ghostgleam', 'Bellbutton + Anemone', 'Bellbutton + Thistle',
                'Bellbutton + Heavy Nettle', 'Bellbutton + Marigold', 'Bellbutton + Eggwort', 'Bellbutton + Petunia',
                'Bellbutton + Dreampuff', 'Bellbutton + Poinsettia', 'Bellbutton + Glowbal', 'Bellbutton + Bowblossom',
                'Bellbutton + Wheatflower', 'Bellbutton + Rose', 'Bellbutton + Happadil', 'Bellbutton + Pinwheel'
            ],
            'Dandelily': [
                'Dandelily + Dandelily', 'Dandelily + Bellbutton', 'Dandelily + Tulias', 'Dandelily + Penstemum',
                'Dandelily + Hibiscus', 'Dandelily + Ghostgleam', 'Dandelily + Anemone', 'Dandelily + Thistle',
                'Dandelily + Heavy Nettle', 'Dandelily + Marigold', 'Dandelily + Eggwort', 'Dandelily + Petunia',
                'Dandelily + Dreampuff', 'Dandelily + Poinsettia', 'Dandelily + Glowbal', 'Dandelily + Bowblossom',
                'Dandelily + Wheatflower', 'Dandelily + Rose', 'Dandelily + Happadil', 'Dandelily + Pinwheel'
            ],
            'Penstemum': [
                'Penstemum + Penstemum', 'Penstemum + Bellbutton', 'Penstemum + Tulias', 'Penstemum + Dandelily',
                'Penstemum + Hibiscus', 'Penstemum + Ghostgleam', 'Penstemum + Anemone', 'Penstemum + Thistle',
                'Penstemum + Heavy Nettle', 'Penstemum + Marigold', 'Penstemum + Eggwort', 'Penstemum + Petunia',
                'Penstemum + Dreampuff', 'Penstemum + Poinsettia', 'Penstemum + Glowbal', 'Penstemum + Bowblossom',
                'Penstemum + Wheatflower', 'Penstemum + Rose', 'Penstemum + Happadil', 'Penstemum + Pinwheel'
            ],
            'Tulias': [
                'Tulias + Tulias', 'Tulias + Dandelily', 'Tulias + Penstemum', 'Tulias + Hibiscus',
                'Tulias + Ghostgleam', 'Tulias + Anemone', 'Tulias + Thistle', 'Tulias + Heavy Nettle',
                'Tulias + Marigold', 'Tulias + Eggwort', 'Tulias + Petunia', 'Tulias + Dreampuff',
                'Tulias + Poinsettia', 'Tulias + Glowbal', 'Tulias + Bowblossom', 'Tulias + Wheatflower',
                'Tulias + Rose', 'Tulias + Happadil', 'Tulias + Pinwheel'
            ],
            'Hibiscus': [
                'Hibiscus + Hibiscus', 'Hibiscus + Tulias', 'Hibiscus + Ghostgleam', 'Hibiscus + Anemone',
                'Hibiscus + Thistle', 'Hibiscus + Heavy Nettle', 'Hibiscus + Marigold', 'Hibiscus + Eggwort',
                'Hibiscus + Petunia', 'Hibiscus + Dreampuff', 'Hibiscus + Poinsettia', 'Hibiscus + Glowbal',
                'Hibiscus + Bowblossom', 'Hibiscus + Wheatflower', 'Hibiscus + Rose', 'Hibiscus + Happadil',
                'Hibiscus + Pinwheel'
            ],
            'Ghostgleam': [
                'Ghostgleam + Ghostgleam', 'Ghostgleam + Hibiscus', 'Ghostgleam + Anemone', 'Ghostgleam + Thistle',
                'Ghostgleam + Heavy Nettle', 'Ghostgleam + Marigold', 'Ghostgleam + Eggwort', 'Ghostgleam + Petunia',
                'Ghostgleam + Dreampuff', 'Ghostgleam + Poinsettia', 'Ghostgleam + Glowbal', 'Ghostgleam + Bowblossom',
                'Ghostgleam + Wheatflower', 'Ghostgleam + Rose', 'Ghostgleam + Happadil', 'Ghostgleam + Pinwheel'
            ],
            'Anemone': [
                'Anemone + Anemone', 'Anemone + Ghostgleam', 'Anemone + Thistle', 'Anemone + Heavy Nettle',
                'Anemone + Marigold', 'Anemone + Eggwort', 'Anemone + Petunia', 'Anemone + Dreampuff',
                'Anemone + Poinsettia', 'Anemone + Glowbal', 'Anemone + Bowblossom', 'Anemone + Wheatflower',
                'Anemone + Rose', 'Anemone + Happadil', 'Anemone + Pinwheel'
            ],
            'Thistle': [
                'Thistle + Thistle', 'Thistle + Anemone', 'Thistle + Heavy Nettle', 'Thistle + Marigold',
                'Thistle + Eggwort', 'Thistle + Petunia', 'Thistle + Dreampuff', 'Thistle + Poinsettia',
                'Thistle + Glowbal', 'Thistle + Bowblossom', 'Thistle + Wheatflower', 'Thistle + Rose',
                'Thistle + Happadil', 'Thistle + Pinwheel'
            ],
            'Heavy Nettle': [
                'Heavy Nettle + Heavy Nettle', 'Heavy Nettle + Anemone', 'Heavy Nettle + Heavy Nettle',
                'Heavy Nettle + Marigold', 'Heavy Nettle + Eggwort', 'Heavy Nettle + Petunia',
                'Heavy Nettle + Dreampuff', 'Heavy Nettle + Poinsettia', 'Heavy Nettle + Glowbal',
                'Heavy Nettle + Bowblossom', 'Heavy Nettle + Wheatflower', 'Heavy Nettle + Rose',
                'Heavy Nettle + Happadil', 'Heavy Nettle + Pinwheel'
            ],
            'Marigold': [
                'Marigold + Marigold', 'Marigold + Heavy Nettle', 'Marigold + Eggwort', 'Heavy Nettle + Eggwort'
            ],
            'Eggwort': [
                'Eggwort + Eggwort', 'Eggwort + Marigold', 'Eggwort + Petunia', 'Marigold + Petunia'
            ],
            'Petunia': [
                'Petunia + Petunia', 'Petunia + Eggwort', 'Petunia + Dreampuff', 'Eggwort + Dreampuff'
            ],
            'Dreampuff': [
                'Dreampuff + Dreampuff', 'Dreampuff + Petunia', 'Dreampuff + Poinsettia', 'Petunia + Poinsettia'
            ],
            'Poinsettia': [
                'Poinsettia + Poinsettia', 'Poinsettia + Dreampuff', 'Poinsettia + Glowbal', 'Dreampuff + Glowbal'
            ],
            'Glowbal': [
                'Glowbal + Glowbal', 'Glowbal + Poinsettia', 'Glowbal + Bowblossom', 'Poinsettia + Bowblossom'
            ],
            'Bowblossom': [
                'Bowblossom + Bowblossom', 'Bowblossom + Dandelily', 'Bowblossom + Penstemum', 'Bowblossom + Hibiscus',
                'Bowblossom + Ghostgleam', 'Bowblossom + Anemone', 'Bowblossom + Thistle', 'Bowblossom + Heavy Nettle',
                'Bowblossom + Marigold', 'Bowblossom + Eggwort', 'Bowblossom + Petunia', 'Bowblossom + Dreampuff',
                'Bowblossom + Poinsettia', 'Bowblossom + Glowbal', 'Bowblossom + Wheatflower', 'Bowblossom + Rose',
                'Bowblossom + Pinwheel'
            ],
            'Bubbaluna': [
                'Bubbaluna + Bubbaluna', 'Bubbaluna + Eggwort', 'Bubbaluna + Bowblossom', 'Marigold + Happadil'
            ],
            'Frostfeather': [
                'Frostfeather + Frostfeather', 'Frostfeather + Eggwort', 'Frostfeather + Bowblossom', 'Frostfeather + Glowbal'
            ],
            'Wheatflower': [
                'Wheatflower + Wheatflower', 'Wheatflower + Dandelily', 'Wheatflower + Penstemum', 'Wheatflower + Hibiscus',
                'Wheatflower + Ghostgleam', 'Wheatflower + Anemone', 'Wheatflower + Thistle', 'Wheatflower + Heavy Nettle',
                'Wheatflower + Marigold', 'Wheatflower + Eggwort', 'Wheatflower + Petunia', 'Wheatflower + Dreampuff',
                'Wheatflower + Poinsettia', 'Wheatflower + Glowbal', 'Wheatflower + Bowblossom', 'Wheatflower + Rose',
                'Wheatflower + Pinwheel'
            ],
            'Sunburst': [
                'Sunburst + Sunburst', 'Sunburst + Dandelily', 'Sunburst + Penstemum', 'Sunburst + Hibiscus',
                'Sunburst + Ghostgleam', 'Sunburst + Anemone', 'Sunburst + Thistle', 'Sunburst + Heavy Nettle',
                'Sunburst + Marigold', 'Sunburst + Eggwort', 'Sunburst + Petunia', 'Sunburst + Dreampuff',
                'Sunburst + Poinsettia', 'Sunburst + Glowbal', 'Sunburst + Bowblossom', 'Sunburst + Rose',
                'Sunburst + Pinwheel'                
            ],
            'Rose': [
                'Rose + Rose', 'Rose + Dandelily', 'Rose + Penstemum', 'Rose + Hibiscus', 'Rose + Ghostgleam',
                'Rose + Anemone', 'Rose + Thistle', 'Rose + Heavy Nettle', 'Rose + Marigold', 'Rose + Eggwort',
                'Rose + Petunia', 'Rose + Dreampuff', 'Rose + Poinsettia', 'Rose + Glowbal', 'Rose + Bowblossom',
                'Rose + Wheatflower', 'Rose + Pinwheel'
            ],
            'Blazebulb': [
                'Blazebulb + Blazebulb', 'Blazebulb + Eggwort', 'Blazebulb + Bowblossom', 'Blazebulb + Glowbal', 'Rose + Happadil'
            ],
            'Happadil': [
                'Happadil + Happadil', 'Happadil + Dandelily', 'Happadil + Penstemum', 'Happadil + Hibiscus',
                'Happadil + Ghostgleam', 'Happadil + Anemone', 'Happadil + Thistle', 'Happadil + Heavy Nettle',
                'Happadil + Marigold', 'Happadil + Eggwort', 'Happadil + Petunia', 'Happadil + Dreampuff',
                'Happadil + Poinsettia', 'Happadil + Glowbal', 'Happadil + Bowblossom', 'Happadil + Wheatflower',
                'Happadil + Rose', 'Happadil + Pinwheel'
            ],
            'Crystalia': [
                'Crystalia + Crystalia', 'Crystalia + Eggwort', 'Crystalia + Bowblossom', 'Crystalia + Happadil', 'Happadil + Glowbal'
            ],
            'Pinwheel': [
                'Pinwheel + Pinwheel', 'Pinwheel + Dandelily', 'Pinwheel + Penstemum', 'Pinwheel + Hibiscus',
                'Pinwheel + Ghostgleam', 'Pinwheel + Anemone', 'Pinwheel + Thistle', 'Pinwheel + Heavy Nettle',
                'Pinwheel + Marigold', 'Pinwheel + Eggwort', 'Pinwheel + Petunia', 'Pinwheel + Dreampuff',
                'Pinwheel + Poinsettia', 'Pinwheel + Glowbal', 'Pinwheel + Bowblossom', 'Pinwheel + Wheatflower',
                'Pinwheel + Rose', 'Pinwheel + Happadil'
            ]
        };

        return originalCombinations[flowerName] || [];
    }

    setupGlossaryEventListeners() {
        // Search input
        document.getElementById('glossarySearch')?.addEventListener('input', (e) => {
            this.filterGlossary();
        });

        // Type filter
        document.getElementById('glossaryTypeFilter')?.addEventListener('change', (e) => {
            this.filterGlossary();
        });

        // Location filter
        document.getElementById('glossaryLocationFilter')?.addEventListener('change', (e) => {
            this.filterGlossary();
        });

        // Help button
        document.getElementById('glossaryHelpButton')?.addEventListener('click', (e) => {
            this.showGlossaryHelp();
        });

        // View mode buttons
        document.getElementById('glossaryListViewBtn')?.addEventListener('click', (e) => {
            this.switchToListView();
        });

        document.getElementById('glossaryTableViewBtn')?.addEventListener('click', (e) => {
            this.switchToTableView();
        });

        // Table type buttons
        document.getElementById('glossaryPatternTableBtn')?.addEventListener('click', (e) => {
            this.generatePatternTable();
        });

        document.getElementById('glossaryLocationTableBtn')?.addEventListener('click', (e) => {
            this.generateLocationTable();
        });

        // Primary only toggle
        document.getElementById('glossaryShowPrimaryOnly')?.addEventListener('change', (e) => {
            this.refreshCurrentTable();
        });
    }

    showGlossaryHelp() {
        this.showModal('glossaryHelpModal');
        this.playSound('click');
    }

    switchToListView() {
        // Update button states
        document.getElementById('glossaryListViewBtn').classList.add('active');
        document.getElementById('glossaryTableViewBtn').classList.remove('active');
        
        // Show/hide containers
        document.getElementById('glossaryResults').style.display = 'block';
        document.getElementById('glossaryTableContainer').style.display = 'none';
        document.getElementById('glossaryTableControls').style.display = 'none';
        
        this.playSound('click');
    }

    switchToTableView() {
        // Update button states
        document.getElementById('glossaryListViewBtn').classList.remove('active');
        document.getElementById('glossaryTableViewBtn').classList.add('active');
        
        // Show/hide containers
        document.getElementById('glossaryResults').style.display = 'none';
        document.getElementById('glossaryTableContainer').style.display = 'block';
        document.getElementById('glossaryTableControls').style.display = 'block';
        
        // Default to patterns table
        this.generatePatternTable();
        this.playSound('click');
    }

    generatePatternTable() {
        // Update button states
        document.getElementById('glossaryPatternTableBtn').classList.add('active');
        document.getElementById('glossaryLocationTableBtn').classList.remove('active');
        
        this.playSound('click');
        
        const showPrimaryOnly = document.getElementById('glossaryShowPrimaryOnly').checked;
        const table = document.getElementById('glossaryTable');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');
        
        // Clear existing content
        thead.innerHTML = '<th class="sticky-column">Flower</th>';
        tbody.innerHTML = '';
        
        // Get filtered flowers based on current search/filter state
        const filteredFlowers = this.getFilteredFlowers();
        
        // Get all unique patterns from filtered flowers
        const allPatterns = new Set();
        filteredFlowers.forEach(([flowerName, flowerData]) => {
            if (showPrimaryOnly) {
                allPatterns.add(flowerData.defaultPattern);
            } else {
                flowerData.compatiblePatterns.forEach(pattern => allPatterns.add(pattern));
            }
        });
        
        const sortedPatterns = Array.from(allPatterns).sort();
        
        // Create headers
        sortedPatterns.forEach(pattern => {
            const th = document.createElement('th');
            th.textContent = pattern;
            th.className = 'text-center';
            thead.appendChild(th);
        });
        
        // Create rows for filtered flowers only
        filteredFlowers.forEach(([flowerName, flowerData]) => {
            const row = document.createElement('tr');
            
            // Flower name cell
            const nameCell = document.createElement('td');
            nameCell.className = 'sticky-column flower-name-cell';
            nameCell.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="glossary-flower-type ${flowerData.type} me-2">${flowerData.type}</span>
                    <strong>${flowerName}</strong>
                </div>
            `;
            row.appendChild(nameCell);
            
            // Pattern cells
            sortedPatterns.forEach(pattern => {
                const cell = document.createElement('td');
                cell.className = 'text-center';
                
                const hasPattern = showPrimaryOnly ? 
                    flowerData.defaultPattern === pattern : 
                    flowerData.compatiblePatterns.includes(pattern);
                
                const isPrimary = flowerData.defaultPattern === pattern;
                
                if (hasPattern) {
                    cell.innerHTML = `<i class="fas fa-check text-success"></i>`;
                    if (isPrimary) {
                        cell.innerHTML += ` <small class="text-muted">(default)</small>`;
                    }
                } else {
                    cell.innerHTML = '<i class="fas fa-times text-muted"></i>';
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
        
        // Show no results message if no flowers match
        if (filteredFlowers.length === 0) {
            this.showNoResultsMessage();
        } else {
            this.hideNoResultsMessage();
        }
    }

    generateLocationTable() {
        // Update button states
        document.getElementById('glossaryPatternTableBtn').classList.remove('active');
        document.getElementById('glossaryLocationTableBtn').classList.add('active');
        
        this.playSound('click');
        
        const showPrimaryOnly = document.getElementById('glossaryShowPrimaryOnly').checked;
        const table = document.getElementById('glossaryTable');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');
        
        // Clear existing content
        thead.innerHTML = '<th class="sticky-column">Flower</th>';
        tbody.innerHTML = '';
        
        // Get filtered flowers based on current search/filter state
        const filteredFlowers = this.getFilteredFlowers();
        
        // Get all unique locations from filtered flowers
        const allLocations = new Set();
        filteredFlowers.forEach(([flowerName, flowerData]) => {
            if (showPrimaryOnly) {
                flowerData.locations.forEach(location => allLocations.add(location));
            } else {
                [...flowerData.locations, ...flowerData.compatibleLocations].forEach(location => allLocations.add(location));
            }
        });
        
        const sortedLocations = Array.from(allLocations).sort();
        
        // Create headers
        sortedLocations.forEach(location => {
            const th = document.createElement('th');
            th.textContent = location;
            th.className = 'text-center';
            thead.appendChild(th);
        });
        
        // Create rows for filtered flowers only
        filteredFlowers.forEach(([flowerName, flowerData]) => {
            const row = document.createElement('tr');
            
            // Flower name cell
            const nameCell = document.createElement('td');
            nameCell.className = 'sticky-column flower-name-cell';
            nameCell.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="glossary-flower-type ${flowerData.type} me-2">${flowerData.type}</span>
                    <strong>${flowerName}</strong>
                </div>
            `;
            row.appendChild(nameCell);
            
            // Location cells
            sortedLocations.forEach(location => {
                const cell = document.createElement('td');
                cell.className = 'text-center';
                
                const hasLocation = showPrimaryOnly ? 
                    flowerData.locations.includes(location) : 
                    [...flowerData.locations, ...flowerData.compatibleLocations].includes(location);
                
                const isPrimary = flowerData.locations.includes(location);
                
                if (hasLocation) {
                    cell.innerHTML = `<i class="fas fa-check text-success"></i>`;
                    if (isPrimary) {
                        cell.innerHTML += ` <small class="text-muted">(native)</small>`;
                    }
                } else {
                    cell.innerHTML = '<i class="fas fa-times text-muted"></i>';
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
        
        // Show no results message if no flowers match
        if (filteredFlowers.length === 0) {
            this.showNoResultsMessage();
        } else {
            this.hideNoResultsMessage();
        }
    }

    refreshCurrentTable() {
        const patternBtn = document.getElementById('glossaryPatternTableBtn');
        const locationBtn = document.getElementById('glossaryLocationTableBtn');
        
        this.playSound('click');
        
        if (patternBtn.classList.contains('active')) {
            this.generatePatternTable();
        } else if (locationBtn.classList.contains('active')) {
            this.generateLocationTable();
        }
    }

    async showGlossary() {
        await this.ensureGlossaryReady();
        this.showModal('glossaryModal');
        this.displayGlossaryResults();

        // Set default view mode
        this.switchToListView();
        this.playSound('click');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    playSound(soundType) {
        const audioElement = document.getElementById(`${soundType}Audio`);
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    displayGlossaryResults() {
        const resultsContainer = document.getElementById('glossaryResults');
        if (!resultsContainer) return;

        const flowers = Object.keys(this.flowerData);
        resultsContainer.innerHTML = '';

        flowers.forEach(flowerName => {
            const flowerData = this.flowerData[flowerName];
            const flowerCard = this.createFlowerCard(flowerName, flowerData);
            resultsContainer.appendChild(flowerCard);
        });
    }

    createFlowerCard(flowerName, flowerData) {
        const card = document.createElement('div');
        card.className = 'glossary-item';
        card.dataset.flowerName = flowerName.toLowerCase();
        card.dataset.flowerType = flowerData.type;
        card.dataset.flowerLocations = flowerData.locations.join(',');
        card.dataset.compatibleLocations = flowerData.compatibleLocations.join(',');
        card.dataset.defaultPattern = flowerData.defaultPattern;
        card.dataset.compatiblePatterns = flowerData.compatiblePatterns.join(',');

        const typeClass = flowerData.type === 'event' ? 'event' : flowerData.type === 'extreme' ? 'extreme' : 'general';

        // Create combined locations HTML with primary locations highlighted
        const allLocations = [...new Set([...flowerData.locations, ...flowerData.compatibleLocations])];
        const locationsHtml = allLocations.map(loc => {
            const isPrimary = flowerData.locations.includes(loc);
            const className = isPrimary ? 'glossary-location-tag primary' : 'glossary-location-tag compatible';
            return `<span class="${className}">${loc}</span>`;
        }).join('');

        // Create combined patterns HTML with default pattern highlighted
        const allPatterns = [...new Set([...flowerData.compatiblePatterns])];
        const patternsHtml = allPatterns.map(pattern => {
            const isDefault = pattern === flowerData.defaultPattern;
            const className = isDefault ? 'glossary-pattern-tag primary' : 'glossary-pattern-tag';
            return `<span class="${className}">${pattern}</span>`;
        }).join('');

        // Create native colors HTML
        const colorsHtml = flowerData.nativeColors.map(color => {
            return `<span class="glossary-color-tag">${color}</span>`;
        }).join('');

        card.innerHTML = `
            <div class="glossary-item-header">
                <h5 class="glossary-flower-name">${flowerName}</h5>
                <span class="glossary-flower-type ${typeClass}">${flowerData.type}</span>
            </div>
            <div class="glossary-flower-info">
                <div class="glossary-info-section">
                    <h6><i class="fas fa-map-marker-alt me-1"></i>Locations</h6>
                    <div class="glossary-locations">${locationsHtml}</div>
                </div>
                <div class="glossary-info-section">
                    <h6><i class="fas fa-info-circle me-1"></i>Type</h6>
                    <p class="mb-0">${flowerData.type === 'event' ? 'Event Flower - Available during special events' : flowerData.type === 'extreme' ? 'Extreme Flower - Grows in extreme locations' : 'General Flower - Available year-round'}</p>
                </div>
                <div class="glossary-info-section">
                    <h6><i class="fas fa-palette me-1"></i>Patterns</h6>
                    <div class="glossary-patterns">${patternsHtml}</div>
                </div>
                <div class="glossary-info-section">
                    <h6><i class="fas fa-paint-brush me-1"></i>Native Colors</h6>
                    <div class="glossary-colors">${colorsHtml}</div>
                </div>
            </div>
        `;

        return card;
    }

    createParentCombinationsTable(parentCombinations) {
        const tableRows = parentCombinations.map(combo => {
            const [parent1, parent2] = combo.split(' + ');
            return `
                <tr>
                    <td class="parent-1">${parent1}</td>
                    <td class="parent-2">${parent2}</td>
                </tr>
            `;
        }).join('');

        return `
            <table class="glossary-parent-table">
                <thead>
                    <tr>
                        <th>Parent 1</th>
                        <th>Parent 2</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
    }

    filterGlossary() {
        const searchTerm = document.getElementById('glossarySearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('glossaryTypeFilter')?.value || '';
        const locationFilter = document.getElementById('glossaryLocationFilter')?.value || '';

        // Check if we're in list view or table view
        const resultsContainer = document.getElementById('glossaryResults');
        const tableContainer = document.getElementById('glossaryTableContainer');
        
        if (resultsContainer && resultsContainer.style.display !== 'none') {
            // Filter list view
            this.filterListView(searchTerm, typeFilter, locationFilter);
        } else if (tableContainer && tableContainer.style.display !== 'none') {
            // Filter table view
            this.filterTableView(searchTerm, typeFilter, locationFilter);
        }
    }

    filterListView(searchTerm, typeFilter, locationFilter) {
        const resultsContainer = document.getElementById('glossaryResults');
        if (!resultsContainer) return;

        const flowerCards = resultsContainer.querySelectorAll('.glossary-item');
        let visibleCount = 0;

        flowerCards.forEach(card => {
            const flowerName = card.dataset.flowerName;
            const flowerType = card.dataset.flowerType;
            const flowerLocations = card.dataset.flowerLocations;
            const compatibleLocations = card.dataset.compatibleLocations;
            const defaultPattern = card.dataset.defaultPattern;
            const compatiblePatterns = card.dataset.compatiblePatterns;

            const matches = this.checkFilters(flowerName, flowerType, flowerLocations, compatibleLocations, defaultPattern, compatiblePatterns, searchTerm, typeFilter, locationFilter);

            if (matches) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Show no results message if no flowers match
        if (visibleCount === 0) {
            this.showNoResultsMessage();
        } else {
            this.hideNoResultsMessage();
        }
    }

    filterTableView(searchTerm, typeFilter, locationFilter) {
        const table = document.getElementById('glossaryTable');
        if (!table) return;

        // If search is cleared and no other filters are active, regenerate the table
        if (!searchTerm && !typeFilter && !locationFilter) {
            // Regenerate the current table type
            const patternBtn = document.getElementById('glossaryPatternTableBtn');
            const locationBtn = document.getElementById('glossaryLocationTableBtn');
            
            if (patternBtn.classList.contains('active')) {
                this.generatePatternTable();
            } else if (locationBtn.classList.contains('active')) {
                this.generateLocationTable();
            }
            return;
        }

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const nameCell = row.querySelector('.flower-name-cell');
            if (!nameCell) return;

            const flowerNameElement = nameCell.querySelector('strong');
            if (!flowerNameElement) return;

            const flowerName = flowerNameElement.textContent.toLowerCase();
            const flowerData = this.flowerData[flowerNameElement.textContent];
            
            if (!flowerData) return;

            const flowerType = flowerData.type;
            const flowerLocations = flowerData.locations.join(',');
            const compatibleLocations = flowerData.compatibleLocations.join(',');
            const defaultPattern = flowerData.defaultPattern;
            const compatiblePatterns = flowerData.compatiblePatterns.join(',');

            const matches = this.checkFilters(flowerName, flowerType, flowerLocations, compatibleLocations, defaultPattern, compatiblePatterns, searchTerm, typeFilter, locationFilter);

            if (matches) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Show no results message if no flowers match
        if (visibleCount === 0) {
            this.showNoResultsMessage();
        } else {
            this.hideNoResultsMessage();
        }
    }

    getFilteredFlowers() {
        const searchTerm = document.getElementById('glossarySearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('glossaryTypeFilter')?.value || '';
        const locationFilter = document.getElementById('glossaryLocationFilter')?.value || '';

        return Object.entries(this.flowerData).filter(([flowerName, flowerData]) => {
            const flowerLocations = flowerData.locations.join(',');
            const compatibleLocations = flowerData.compatibleLocations.join(',');
            const compatiblePatterns = flowerData.compatiblePatterns.join(',');

            return this.checkFilters(
                flowerName.toLowerCase(),
                flowerData.type,
                flowerLocations,
                compatibleLocations,
                flowerData.defaultPattern,
                compatiblePatterns,
                searchTerm,
                typeFilter,
                locationFilter
            );
        });
    }

    checkFilters(flowerName, flowerType, flowerLocations, compatibleLocations, defaultPattern, compatiblePatterns, searchTerm, typeFilter, locationFilter) {
        // Search functionality - search in flower name, locations, and patterns
        const matchesSearch = !searchTerm ||
            flowerName.includes(searchTerm) ||
            flowerLocations.toLowerCase().includes(searchTerm) ||
            compatibleLocations.toLowerCase().includes(searchTerm) ||
            defaultPattern.toLowerCase().includes(searchTerm) ||
            compatiblePatterns.toLowerCase().includes(searchTerm);

        const matchesType = !typeFilter || flowerType === typeFilter;

        // Location filter - check both primary and compatible locations with exact matches
        const primaryLocations = flowerLocations.toLowerCase().split(',').map(loc => loc.trim());
        const compatibleLocationsList = compatibleLocations.toLowerCase().split(',').map(loc => loc.trim());

        const matchesLocation = !locationFilter ||
            primaryLocations.includes(locationFilter.toLowerCase()) ||
            compatibleLocationsList.includes(locationFilter.toLowerCase());

        return matchesSearch && matchesType && matchesLocation;
    }

    showNoResultsMessage() {
        // Check if we're in list view or table view
        const resultsContainer = document.getElementById('glossaryResults');
        const tableContainer = document.getElementById('glossaryTableContainer');
        
        let container = null;
        if (resultsContainer && resultsContainer.style.display !== 'none') {
            container = resultsContainer;
        } else if (tableContainer && tableContainer.style.display !== 'none') {
            container = tableContainer;
        }
        
        if (!container) return;

        let noResultsMsg = container.querySelector('.glossary-no-results');
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'glossary-no-results';
            noResultsMsg.innerHTML = `
                <i class="fas fa-search"></i>
                <h5>No flowers found</h5>
                <p>Try adjusting your search terms or filters</p>
            `;
            container.appendChild(noResultsMsg);
        }
        noResultsMsg.style.display = 'block';
    }

    hideNoResultsMessage() {
        // Hide no results message from both list and table views
        const resultsContainer = document.getElementById('glossaryResults');
        const tableContainer = document.getElementById('glossaryTableContainer');
        
        [resultsContainer, tableContainer].forEach(container => {
            if (container) {
                const noResultsMsg = container.querySelector('.glossary-no-results');
                if (noResultsMsg) {
                    noResultsMsg.style.display = 'none';
                }
            }
        });
    }
}

// Create global instance
window.glossaryManager = new GlossaryManager();