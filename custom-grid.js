/**
 * Custom Grid Manager for Flower Breeding Simulator
 * Handles custom plot layouts with custom rows/cols and disabled cells
 */
class CustomGridManager {
    constructor() {
        this.customLayouts = new Map();
        this.currentLayout = null;
        this.isCustomGridMode = false;
        
        // Initialize with default layouts
        this.initializeDefaultLayouts();
    }

    /**
     * Initialize default custom layouts
     */
    initializeDefaultLayouts() {
        // Resort layouts
        this.addCustomLayout('sr1', {
            name: 'Resort Hopscotch Islands',
            rows: 6,
            cols: 5,
            disabledCells: this.generateResortHopscotchLayout()
        });
        
        this.addCustomLayout('sr2', {
            name: 'Resort Cozy Islands',
            rows: 5,
            cols: 7,
            disabledCells: this.generateResortCozyIslandsLayout()
        });
        
        this.addCustomLayout('sr3', {
            name: 'Resort Cabin',
            rows: 4,
            cols: 2,
            disabledCells: this.generateResortCabinLayout()
        });
        
        this.addCustomLayout('sr4', {
            name: 'Resort Cabin Pond',
            rows: 2,
            cols: 6,
            disabledCells: this.generateResortCabinPondLayout()
        });
        
        this.addCustomLayout('sr5', {
            name: 'Resort Lower West',
            rows: 3,
            cols: 5,
            disabledCells: this.generateResortLowerWestLayout()
        });
        
        this.addCustomLayout('sr6', {
            name: 'Resort Middle West',
            rows: 4,
            cols: 7,
            disabledCells: this.generateResortMiddleWestLayout()
        });
        
        this.addCustomLayout('sr7', {
            name: 'Resort Gudetama Sign',
            rows: 2,
            cols: 4,
            disabledCells: this.generateResortGudetamaSignLayout()
        });
        
        this.addCustomLayout('sr8', {
            name: 'Resort Cliff Top',
            rows: 5,
            cols: 4,
            disabledCells: this.generateResortCliffTopLayout()
        });
        
        this.addCustomLayout('sr9', {
            name: 'Resort Cliff Bottom',
            rows: 3,
            cols: 5,
            disabledCells: this.generateResortCliffBottomLayout()
        });
        
        this.addCustomLayout('sr10', {
            name: 'Resort Upper West',
            rows: 8,
            cols: 9,
            disabledCells: this.generateResortUpperWestLayout()
        });
        
        this.addCustomLayout('sr11', {
            name: 'Resort Topmost West',
            rows: 8,
            cols: 13,
            disabledCells: this.generateResortTopmostWestLayout()
        });
        
        this.addCustomLayout('sr12', {
            name: 'Resort Gate',
            rows: 12,
            cols: 12,
            disabledCells: this.generateResortGateLayout()
        });
        
        // Swamp layouts
        this.addCustomLayout('ss1', {
            name: 'Swamp Ghost Ride',
            rows: 6,
            cols: 11,
            disabledCells: this.generateSwampGhostRideLayout()
        });
        
        this.addCustomLayout('ss2', {
            name: 'Swamp Nature Reserve',
            rows: 8,
            cols: 10,
            disabledCells: this.generateSwampNatureReserveLayout()
        });
        
        // Gemstone layouts
        this.addCustomLayout('gm1', {
            name: 'Gemstone Cabins West',
            rows: 5,
            cols: 12,
            disabledCells: this.generateGemstoneCabinsWestLayout()
        });
        
        this.addCustomLayout('gm2', {
            name: 'Gemstone Oasis West North',
            rows: 8,
            cols: 9,
            disabledCells: this.generateGemstoneOasisWestNorthLayout()
        });
        
        this.addCustomLayout('gm3', {
            name: 'Gemstone Oasis West South',
            rows: 4,
            cols: 6,
            disabledCells: this.generateGemstoneOasisWestSouthLayout()
        });
        
        this.addCustomLayout('gm4', {
            name: 'Gemstone Oasis East',
            rows: 4,
            cols: 8,
            disabledCells: this.generateGemstoneOasisEastLayout()
        });
        
        this.addCustomLayout('gm5', {
            name: 'Gemstone Peak Trail',
            rows: 4,
            cols: 6,
            disabledCells: this.generateGemstonePeakTrailLayout()
        });
        
        this.addCustomLayout('gm6', {
            name: 'Gemstone Mine Entrance Pond',
            rows: 5,
            cols: 11,
            disabledCells: this.generateGemstoneMineEntrancePondLayout()
        });
        
        this.addCustomLayout('gm7', {
            name: 'Gemstone Mine Entrance Town',
            rows: 4,
            cols: 8,
            disabledCells: this.generateGemstoneMineEntranceTownLayout()
        });
        
        this.addCustomLayout('gm8', {
            name: 'Gemstone Town Crafting Table',
            rows: 5,
            cols: 4,
            disabledCells: this.generateGemstoneTownCraftingTableLayout()
        });
        
        this.addCustomLayout('gm9', {
            name: 'Gemstone Deadwood Forest',
            rows: 4,
            cols: 6,
            disabledCells: this.generateGemstoneDeadwoodForestLayout()
        });
        
        this.addCustomLayout('gm10', {
            name: 'Gemstone Cabin 1 North',
            rows: 5,
            cols: 5,
            disabledCells: this.generateGemstoneCabin1NorthLayout()
        });
        
        this.addCustomLayout('gm11', {
            name: 'Gemstone Cabin 1 South',
            rows: 3,
            cols: 6,
            disabledCells: this.generateGemstoneCabin1SouthLayout()
        });
        
        // Reef layouts
        this.addCustomLayout('rr1', {
            name: 'Reef Club South',
            rows: 6,
            cols: 11,
            disabledCells: this.generateReefClubSouthLayout()
        });
        
        this.addCustomLayout('rr2', {
            name: 'Reef Club East',
            rows: 8,
            cols: 7,
            disabledCells: this.generateReefClubEastLayout()
        });
        
        // Hothead layouts
        this.addCustomLayout('mh1', {
            name: 'Hothead Cabin West',
            rows: 3,
            cols: 4,
            disabledCells: this.generateHotheadCabinWestLayout()
        });
        
        this.addCustomLayout('mh2', {
            name: 'Hothead Ruins West',
            rows: 6,
            cols: 3,
            disabledCells: this.generateHotheadRuinsWestLayout()
        });
        
        this.addCustomLayout('mh3', {
            name: 'Hothead Cabin 3',
            rows: 5,
            cols: 6,
            disabledCells: this.generateHotheadCabin3Layout()
        });
        
        this.addCustomLayout('mh4', {
            name: 'Hothead Pizza Cliff Bottom',
            rows: 5,
            cols: 9,
            disabledCells: this.generateHotheadPizzaCliffBottomLayout()
        });
        
        this.addCustomLayout('mh5', {
            name: 'Hothead Pizza Cliff Top',
            rows: 5,
            cols: 7,
            disabledCells: this.generateHotheadPizzaCliffTopLayout()
        });
        
        this.addCustomLayout('mh6', {
            name: 'Hothead Hot Springs Bridge',
            rows: 6,
            cols: 5,
            disabledCells: this.generateHotheadHotSpringsBridgeLayout()
        });
        
        this.addCustomLayout('mh7', {
            name: 'Hothead Caldera',
            rows: 3,
            cols: 3,
            disabledCells: this.generateHotheadCalderaLayout()
        });
        
        // Meadow layouts
        this.addCustomLayout('mm1', {
            name: 'Meadow Fields Mini',
            rows: 2,
            cols: 3,
            disabledCells: this.generateMeadowFieldsMiniLayout()
        });
        
        this.addCustomLayout('mm2', {
            name: 'Meadow Fields West',
            rows: 10,
            cols: 14,
            disabledCells: this.generateMeadowFieldsWestLayout()
        });
        
        this.addCustomLayout('mm3', {
            name: 'Meadow Fields East',
            rows: 7,
            cols: 13,
            disabledCells: this.generateMeadowFieldsEastLayout()
        });
        
        this.addCustomLayout('mm4', {
            name: 'Meadow Overlook Greenhouse Front',
            rows: 3,
            cols: 15,
            disabledCells: this.generateMeadowOverlookGreenhouseFrontLayout()
        });
        
        this.addCustomLayout('mm5', {
            name: 'Meadow Overlook Puzzle Front',
            rows: 5,
            cols: 8,
            disabledCells: this.generateMeadowOverlookPuzzleFrontLayout()
        });
        
        this.addCustomLayout('mm6', {
            name: 'Meadow Plaza Garden',
            rows: 8,
            cols: 8,
            disabledCells: this.generateMeadowPlazaGardenLayout()
        });
        
        this.addCustomLayout('mm7', {
            name: 'Meadow Temple Corner',
            rows: 9,
            cols: 7,
            disabledCells: this.generateMeadowTempleCornerLayout()
        });
        
        this.addCustomLayout('mm8', {
            name: 'Meadow Gazebo North',
            rows: 8,
            cols: 20,
            disabledCells: this.generateMeadowGazeboNorthLayout()
        });
        
        this.addCustomLayout('mm9', {
            name: 'Meadow Gazebo Path West',
            rows: 8,
            cols: 11,
            disabledCells: this.generateMeadowGazeboPathWestLayout()
        });
        
        this.addCustomLayout('mm10', {
            name: 'Meadow Gazebo Path East',
            rows: 6,
            cols: 9,
            disabledCells: this.generateMeadowGazeboPathEastLayout()
        });
        
        this.addCustomLayout('mm11', {
            name: 'Meadow Corral',
            rows: 2,
            cols: 4,
            disabledCells: this.generateMeadowCorralLayout()
        });
        
        // Other layouts
        this.addCustomLayout('ci1', {
            name: 'Cloud Outer Cabin',
            rows: 8,
            cols: 6,
            disabledCells: this.generateCloudOuterCabinLayout()
        });
        
        this.addCustomLayout('ip1', {
            name: 'Icy Peak Summit',
            rows: 2,
            cols: 4,
            disabledCells: this.generateIcyPeakSummitLayout()
        });
        
        this.addCustomLayout('cc1', {
            name: 'Crystal Caves',
            rows: 2,
            cols: 4,
            disabledCells: this.generateCrystalCavesLayout()
        });
        
        this.addCustomLayout('tm1', {
            name: 'The Moon',
            rows: 2,
            cols: 3,
            disabledCells: this.generateTheMoonLayout()
        });
        
        this.addCustomLayout('ww1', {
            name: 'Wheatflour Upper Left',
            rows: 9,
            cols: 13,
            disabledCells: this.generateWheatflourUpperLeftLayout()
        });
        
        this.addCustomLayout('ww2', {
            name: 'Wheatflour Upper Right',
            rows: 6,
            cols: 15,
            disabledCells: this.generateWheatflourUpperRightLayout()
        });
        
        this.addCustomLayout('ww3', {
            name: 'Wheatflour Lower Left',
            rows: 10,
            cols: 12,
            disabledCells: this.generateWheatflourLowerLeftLayout()
        });
        
        this.addCustomLayout('ww4', {
            name: 'Wheatflour Lower Right',
            rows: 10,
            cols: 12,
            disabledCells: this.generateWheatflourLowerRightLayout()
        });
 
        this.addCustomLayout('ct1', {
            name: 'City West Park',
            rows: 6,
            cols: 10,
            disabledCells: this.generateCityWestParkLayout()
        });

        // Custom grid option
        this.addCustomLayout('custom', {
            name: 'Custom Grid',
            rows: 10,
            cols: 10,
            disabledCells: []
        });

        // Fully upgraded greenhouse — full 10×11 plantable grid (cols × rows)
        this.addCustomLayout('greenhouse', {
            name: 'Fully Upgraded Greenhouse',
            rows: 11,
            cols: 10,
            disabledCells: []
        });
    }

    /**
     * Generate the Resort Hopscotch Islands layout
     */
    generateResortHopscotchLayout() {
        const disabledCells = [];
        
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 5; col++) {
                // Create hopscotch pattern - disable cells to create islands
                const isDisabled = (
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 2) ||
                    
                    (row === 1 && col === 4) ||

                    (row === 2 && col === 0) ||
 
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
  
                    (row === 4 && col === 0) ||
                    (row === 4 && col === 4) ||
                   
                    (row === 5 && col === 4) ||
                    (row === 5 && col === 3) 
                );
                
                if (isDisabled) {
                    disabledCells.push({row, col});
                }
            }
        }
        
        return disabledCells;
    }

    // Resort Layout Generators
    generateResortCozyIslandsLayout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 7; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    
                    (row === 1 && col === 6) ||

                    (row === 2 && col === 0) ||
 
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
  
                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 2) ||
                    (row === 4 && col === 6) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortCabinLayout() {
        const disabledCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 2; col++) {
                const isDisabled = (
                    (row === 0 && col === 1) ||

                    (row === 3 && col === 1) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortCabinPondLayout() {
        const disabledCells = [];
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 6; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                   
                    (row === 1 && col === 3) ||
                    (row === 1 && col === 4) ||
                    (row === 1 && col === 5) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortLowerWestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 5; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 3) ||
                    (row === 2 && col === 4)
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortMiddleWestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 7; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    
                    (row === 1 && col === 6) ||

                    (row === 2 && col === 0) ||
 
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
                    (row === 3 && col === 2) ||
                    (row === 3 && col === 5) ||
                    (row === 3 && col === 6) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortGudetamaSignLayout() {
        const disabledCells = [];
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                   
                    (row === 1 && col === 3) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortCliffTopLayout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                const isDisabled = (
                    
                    (row === 1 && col === 3) ||

                    (row === 2 && col === 3) ||
 
                    (row === 3 && col === 3) ||

                    (row === 4 && col === 3) ||
                    (row === 4 && col === 2) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortCliffBottomLayout() {
        const disabledCells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 5; col++) {
                const isDisabled = (
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    

                    (row === 1 && col === 2) ||
                    (row === 1 && col === 3) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortUpperWestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 9; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 7) ||
                    
                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||
                    (row === 1 && col === 2) ||
                    (row === 1 && col === 3) ||
                    (row === 1 && col === 4) ||
                    (row === 1 && col === 5) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 1) ||
                    (row === 2 && col === 2) ||
                    (row === 2 && col === 3) ||
                    (row === 2 && col === 8) ||

                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
                    (row === 3 && col === 7) ||
                    (row === 3 && col === 8) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 7) ||
                    (row === 4 && col === 8) ||

                    (row === 5 && col === 7) ||
                    (row === 5 && col === 8) ||

                    (row === 6 && col === 0) ||
                    (row === 6 && col === 1) ||
                    (row === 6 && col === 7) ||
                    (row === 6 && col === 8) ||

                    (row === 7 && col === 0) ||
                    (row === 7 && col === 1) ||
                    (row === 7 && col === 2) ||
                    (row === 7 && col === 3) ||
                    (row === 7 && col === 6) ||
                    (row === 7 && col === 7) ||
                    (row === 7 && col === 8) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortTopmostWestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 13; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 12) ||
                    
                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||
                    (row === 1 && col === 2) ||
                    (row === 1 && col === 3) ||
                    (row === 1 && col === 4) ||
                    (row === 1 && col === 5) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 1) ||
                    (row === 2 && col === 2) ||
                    (row === 2 && col === 3) ||
                    (row === 2 && col === 4) ||
 
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
                    (row === 3 && col === 2) ||
                    (row === 3 && col === 3) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 12) ||

                    (row === 5 && col === 12) ||
                    (row === 5 && col === 11) ||

                    (row === 6 && col === 12) ||
                    (row === 6 && col === 11) ||
                    (row === 6 && col === 10) ||
                    (row === 6 && col === 9) ||
                    (row === 6 && col === 8) ||
                    (row === 6 && col === 7) ||

                    (row === 7 && col === 0) ||
                    (row === 7 && col === 3) ||
                    (row === 7 && col === 4) ||
                    (row === 7 && col === 5) ||
                    (row === 7 && col === 6) ||
                    (row === 7 && col === 7) ||
                    (row === 7 && col === 8) ||
                    (row === 7 && col === 9) ||
                    (row === 7 && col === 10) ||
                    (row === 7 && col === 11) ||
                    (row === 7 && col === 12) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateResortGateLayout() {
        const disabledCells = [];
        for (let row = 0; row < 12; row++) {
            for (let col = 0; col < 12; col++) {
                const isDisabled = (
                    (row === 0 && col === 11) ||
                    (row === 0 && col === 10) ||
                    (row === 0 && col === 9) ||
                    (row === 0 && col === 8) ||
                    (row === 0 && col === 7) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 3) ||

                    (row === 1 && col === 11) ||
                    (row === 1 && col === 10) ||
                    (row === 1 && col === 9) ||
                    (row === 1 && col === 8) ||
                    (row === 1 && col === 7) ||
                    (row === 1 && col === 6) ||
                    (row === 1 && col === 5) ||
                    (row === 1 && col === 4) ||
                    (row === 1 && col === 3) ||

                    (row === 2 && col === 10) ||
                    (row === 2 && col === 9) ||
                    (row === 2 && col === 8) ||
                    (row === 2 && col === 7) ||
                    (row === 2 && col === 6) ||
                    (row === 2 && col === 5) ||
                    (row === 2 && col === 4) ||
                    (row === 2 && col === 3) ||
                    (row === 2 && col === 0) ||
 
                    (row === 3 && col === 9) ||
                    (row === 3 && col === 8) ||
                    (row === 3 && col === 7) ||
                    (row === 3 && col === 6) ||
                    (row === 3 && col === 5) ||
                    (row === 3 && col === 4) ||
                    (row === 3 && col === 3) ||
                    (row === 3 && col === 0) ||

                    (row === 4 && col === 9) ||
                    (row === 4 && col === 8) ||
                    (row === 4 && col === 7) ||
                    (row === 4 && col === 6) ||
                    (row === 4 && col === 5) ||
                    (row === 4 && col === 4) ||
                    (row === 4 && col === 0) ||

                    (row === 5 && col === 8) ||
                    (row === 5 && col === 7) ||
                    (row === 5 && col === 6) ||
                    (row === 5 && col === 5) ||
                    (row === 5 && col === 0) ||
                    (row === 5 && col === 1) ||
                    (row === 5 && col === 11) ||

                    (row === 6 && col === 1) ||
                    (row === 6 && col === 0) ||
                    (row === 6 && col === 10) ||
                    (row === 6 && col === 11) ||

                    (row === 7 && col === 1) ||
                    (row === 7 && col === 0) ||
                    (row === 7 && col === 2) ||
                    (row === 7 && col === 10) ||
                    (row === 7 && col === 9) ||
                    (row === 7 && col === 11) ||

                    (row === 8 && col === 1) ||
                    (row === 8 && col === 0) ||
                    (row === 8 && col === 2) ||
                    (row === 8 && col === 10) ||
                    (row === 8 && col === 9) ||
                    (row === 8 && col === 8) ||
                    (row === 8 && col === 11) ||

                    (row === 9 && col === 1) ||
                    (row === 9 && col === 0) ||
                    (row === 9 && col === 2) ||
                    (row === 9 && col === 3) ||
                    (row === 9 && col === 10) ||
                    (row === 9 && col === 9) ||
                    (row === 9 && col === 8) ||
                    (row === 9 && col === 11) ||

                    (row === 10 && col === 1) ||
                    (row === 10 && col === 0) ||
                    (row === 10 && col === 2) ||
                    (row === 10 && col === 3) ||
                    (row === 10 && col === 4) ||
                    (row === 10 && col === 10) ||
                    (row === 10 && col === 9) ||
                    (row === 10 && col === 8) ||
                    (row === 10 && col === 11) ||

                    (row === 11 && col === 1) ||
                    (row === 11 && col === 0) ||
                    (row === 11 && col === 2) ||
                    (row === 11 && col === 3) ||
                    (row === 11 && col === 4) ||
                    (row === 11 && col === 5) ||
                    (row === 11 && col === 10) ||
                    (row === 11 && col === 9) ||
                    (row === 11 && col === 8) ||
                    (row === 11 && col === 11) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    // Swamp Layout Generators
    generateSwampGhostRideLayout() {
        const disabledCells = [];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 11; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 10) ||

                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||

                    (row === 2 && col === 0) ||

                    (row === 4 && col === 10) ||

                    (row === 5 && col === 0) ||
                    (row === 5 && col === 1) ||
                    (row === 5 && col === 10) ||
                    (row === 5 && col === 9) ||
                    (row === 5 && col === 8) ||
                    (row === 5 && col === 7) ||
                    (row === 5 && col === 6) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateSwampNatureReserveLayout() {
        const disabledCells = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 10; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 7) ||
                    (row === 0 && col === 8) ||
                    (row === 0 && col === 9) ||

                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||
                    (row === 1 && col === 2) ||
                    (row === 1 && col === 9) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 1) ||

                    (row === 3 && col === 0) ||

                    (row === 4 && col === 9) ||

                    (row === 5 && col === 9) ||
                    (row === 5 && col === 8) ||
                    (row === 5 && col === 7) ||
                    (row === 5 && col === 6) ||

                    (row === 6 && col === 9) ||
                    (row === 6 && col === 8) ||
                    (row === 6 && col === 7) ||
                    (row === 6 && col === 6) ||
                    (row === 6 && col === 5) ||
                    (row === 6 && col === 4) ||

                    (row === 7 && col === 9) ||
                    (row === 7 && col === 8) ||
                    (row === 7 && col === 7) ||
                    (row === 7 && col === 6) ||
                    (row === 7 && col === 5) ||
                    (row === 7 && col === 4) ||
                    (row === 7 && col === 3) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    // Gemstone Layout Generators
    generateGemstoneCabinsWestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 12; col++) {
                const isDisabled = (
                    (row === 0 && col === 11) ||
                    (row === 0 && col === 10) ||
                    (row === 0 && col === 9) ||
                    (row === 0 && col === 8) ||
                    (row === 0 && col === 7) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 3) ||

                    (row === 1 && col === 10) ||
                    (row === 1 && col === 9) ||
                    (row === 1 && col === 8) ||
                    (row === 1 && col === 7) ||
                    (row === 1 && col === 6) ||
                    (row === 1 && col === 5) ||
                    (row === 1 && col === 4) ||

                    (row === 3 && col === 0) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 4) ||
                    (row === 4 && col === 5) ||
                    (row === 4 && col === 6) ||
                    (row === 4 && col === 8) ||
                    (row === 4 && col === 9) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstoneOasisWestNorthLayout() {
        const disabledCells = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 9; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 8) ||

                    (row === 1 && col === 0) ||

                    (row === 2 && col === 6) ||
                    (row === 2 && col === 5) ||

                    (row === 3 && col === 6) ||
                    (row === 3 && col === 5) ||
                    (row === 3 && col === 4) ||

                    (row === 4 && col === 5) ||
                    (row === 4 && col === 4) ||

                    (row === 6 && col === 0) ||

                    (row === 7 && col === 0) ||
                    (row === 7 && col === 1) ||
                    (row === 7 && col === 2) ||
                    (row === 7 && col === 3) ||
                    (row === 7 && col === 4) ||
                    (row === 7 && col === 5) ||
                    (row === 7 && col === 8) 

                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstoneOasisWestSouthLayout() {
        const disabledCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 5) ||

                    (row === 1 && col === 0) ||

                    (row === 2 && col === 5) ||


                    (row === 3 && col === 0) ||
                    (row === 3 && col === 3) ||
                    (row === 3 && col === 4) ||
                    (row === 3 && col === 5) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstoneOasisEastLayout() {
        const disabledCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 8; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 7) ||

                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||
                    (row === 1 && col === 7) ||

                    (row === 3 && col === 0) ||
                    (row === 3 && col === 7) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstonePeakTrailLayout() {
        const disabledCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 5) ||

                    (row === 1 && col === 0) ||

                    (row === 2 && col === 5) ||
                    (row === 2 && col === 4) ||

                    (row === 3 && col === 5) ||
                    (row === 3 && col === 4) ||
                    (row === 3 && col === 3) ||
                    (row === 3 && col === 2) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstoneMineEntrancePondLayout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 11; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 10) ||

                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||

                    (row === 3 && col === 10) ||

                    (row === 4 && col === 10) ||
                    (row === 4 && col === 9) ||
                    (row === 4 && col === 8) ||
                    (row === 4 && col === 7) ||
                    (row === 4 && col === 6) ||
                    (row === 4 && col === 5) ||
                    (row === 4 && col === 4) ||
                    (row === 4 && col === 3) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstoneMineEntranceTownLayout() {
        const disabledCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 8; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 7) ||


                    (row === 2 && col === 0) ||
                    (row === 2 && col === 7) ||

                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
                    (row === 3 && col === 2) ||
                    (row === 3 && col === 7) ||
                    (row === 3 && col === 6) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstoneTownCraftingTableLayout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                const isDisabled = (
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 2) ||

                    (row === 1 && col === 3) ||
                    
                    (row === 3 && col === 0) ||

                    (row === 4 && col === 1) ||
                    (row === 4 && col === 0) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstoneDeadwoodForestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||

                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||
                   
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 4) ||
                    (row === 3 && col === 5) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstoneCabin1NorthLayout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||

                    (row === 1 && col === 0) ||

                    (row === 3 && col === 4) ||
                   
                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 4) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateGemstoneCabin1SouthLayout() {
        const disabledCells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 6; col++) {
                const isDisabled = (
                    (row === 0 && col === 5) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 5)
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    // Reef Layout Generators
    generateReefClubSouthLayout() {
        const disabledCells = [];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 11; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 10) ||
                    (row === 2 && col === 8) ||
                    (row === 2 && col === 7) ||
                    (row === 3 && col === 8) ||
                    (row === 3 && col === 7) ||
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 2) ||
                    (row === 5 && col === 0) ||
                    (row === 5 && col === 1) ||
                    (row === 5 && col === 2) ||
                    (row === 5 && col === 10) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateReefClubEastLayout() {
        const disabledCells = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 7; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    (row === 1 && col === 0) ||
                    (row === 1 && col === 6) ||
                    (row === 2 && col === 6) ||
                    (row === 3 && col === 6) ||
                    (row === 4 && col === 6) ||
                    (row === 6 && col === 0) ||
                    (row === 7 && col === 0) ||
                    (row === 7 && col === 1) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    // Hothead Layout Generators
    generateHotheadCabinWestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateHotheadRuinsWestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 3; col++) {
                const isDisabled = (
                    (row === 0 && col === 2) ||
                    (row === 2 && col === 0) ||
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 2) ||
                    (row === 4 && col === 0) ||
                    (row === 2 && col === 2) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateHotheadCabin3Layout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 6; col++) {
                const isDisabled = (
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 3) ||
                    (row === 1 && col === 5) ||
                    (row === 1 && col === 4) ||
                    (row === 2 && col === 5) ||
                    (row === 3 && col === 5) ||
                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 2) ||
                    (row === 4 && col === 3) 

                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateHotheadPizzaCliffBottomLayout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 9; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 8) ||

                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||
                    (row === 1 && col === 2) ||
                    (row === 1 && col === 3) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 1) ||
                    (row === 2 && col === 2) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 8) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateHotheadPizzaCliffTopLayout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 7; col++) {
                const isDisabled = (
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 2) ||


                    (row === 2 && col === 0) ||

                    (row === 3 && col === 0) ||
                    (row === 3 && col === 6) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 2) ||
                    (row === 4 && col === 5) ||
                    (row === 4 && col === 6) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateHotheadHotSpringsBridgeLayout() {
        const disabledCells = [];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 5; col++) {
                const isDisabled = (
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 2) ||

                    (row === 1 && col === 4) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 4) ||

                    (row === 5 && col === 0) ||
                    (row === 5 && col === 1) ||
                    (row === 5 && col === 4) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateHotheadCalderaLayout() {
        const disabledCells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 2) ||

                    (row === 2 && col === 2) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    // Meadow Layout Generators
    generateMeadowFieldsMiniLayout() {
        const disabledCells = [];
        // No cells are disabled for this layout
        return disabledCells;
    }

    generateMeadowFieldsWestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 14; col++) {
                const isDisabled = (
                    (row === 0 && col === 13) ||
                    (row === 0 && col === 12) ||
                    (row === 0 && col === 11) ||
                    (row === 0 && col === 10) ||
                    (row === 0 && col === 9) ||
                    (row === 0 && col === 8) ||
                    (row === 0 && col === 7) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 3) ||

                    (row === 1 && col === 13) ||
                    (row === 1 && col === 12) ||
                    (row === 1 && col === 11) ||
                    (row === 1 && col === 10) ||

                    (row === 2 && col === 13) ||
                    (row === 2 && col === 12) ||
                    (row === 2 && col === 0) ||
 
                    (row === 3 && col === 13) ||
                    (row === 3 && col === 0) ||

                    (row === 4 && col === 0) ||

                    (row === 5 && col === 0) ||

                    (row === 6 && col === 0) ||

                    (row === 7 && col === 13) ||
                    (row === 7 && col === 12) ||
                    (row === 7 && col === 0) ||

                    (row === 8 && col === 13) ||
                    (row === 8 && col === 12) ||
                    (row === 8 && col === 11) ||
                    (row === 8 && col === 0) ||
                    (row === 8 && col === 1) ||
                    (row === 8 && col === 2) ||

                    (row === 9 && col === 13) ||
                    (row === 9 && col === 12) ||
                    (row === 9 && col === 11) ||
                    (row === 9 && col === 0) ||
                    (row === 9 && col === 1) ||
                    (row === 9 && col === 3) ||
                    (row === 9 && col === 4) ||
                    (row === 9 && col === 2) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateMeadowFieldsEastLayout() {
        const disabledCells = [];
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 13; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 7) ||
                    (row === 0 && col === 8) ||
                    (row === 0 && col === 9) ||
                    (row === 0 && col === 12) ||

                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||
                    (row === 1 && col === 2) ||
                    (row === 1 && col === 3) ||
                    (row === 1 && col === 4) ||
                    (row === 1 && col === 5) ||
                    (row === 1 && col === 6) ||
                    (row === 1 && col === 7) ||
                    (row === 1 && col === 8) ||
                    (row === 1 && col === 12) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 1) ||
                    (row === 2 && col === 2) ||
                    (row === 2 && col === 3) ||
                    (row === 2 && col === 4) ||
                    (row === 2 && col === 5) ||
                    (row === 2 && col === 6) ||
                    (row === 2 && col === 12) ||
 
                    (row === 4 && col === 12) ||

                    (row === 5 && col === 0) ||
                    (row === 5 && col === 1) ||
                    (row === 5 && col === 2) ||
                    (row === 5 && col === 11) ||
                    (row === 5 && col === 12) ||

                    (row === 6 && col === 0) ||
                    (row === 6 && col === 1) ||
                    (row === 6 && col === 2) ||
                    (row === 6 && col === 3) ||
                    (row === 6 && col === 4) ||
                    (row === 6 && col === 5) ||
                    (row === 6 && col === 6) ||
                    (row === 6 && col === 7) ||
                    (row === 6 && col === 10) ||
                    (row === 6 && col === 11) ||
                    (row === 6 && col === 12) 

                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateMeadowOverlookGreenhouseFrontLayout() {
        const disabledCells = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 15; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 14) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 1) ||
                    (row === 2 && col === 2) ||
                    (row === 2 && col === 13) ||
                    (row === 2 && col === 14) 

                     );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateMeadowOverlookPuzzleFrontLayout() {
        const disabledCells = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 8; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 7) ||

                    (row === 1 && col === 3) ||
                    (row === 1 && col === 4) ||
                    (row === 1 && col === 5) ||
                    (row === 1 && col === 7) ||
 
                    (row === 4 && col === 7) ||
                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateMeadowPlazaGardenLayout() {
        const disabledCells = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 7) ||

                    (row === 1 && col === 4) ||
                    (row === 1 && col === 5) ||
                    (row === 1 && col === 6) ||
                    (row === 1 && col === 7) ||

                    (row === 2 && col === 5) ||
                    (row === 2 && col === 6) ||
                    (row === 2 && col === 7) ||
                    
                    (row === 5 && col === 0) ||

                    (row === 6 && col === 0) ||
                    (row === 6 && col === 1) ||
                    (row === 6 && col === 2) ||
                    (row === 6 && col === 3) ||

                    (row === 7 && col === 0) ||
                    (row === 7 && col === 1) ||
                    (row === 7 && col === 2) ||
                    (row === 7 && col === 3) ||
                    (row === 7 && col === 4) ||
                    (row === 7 && col === 5) ||
                    (row === 7 && col === 7)
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateMeadowTempleCornerLayout() {
        const disabledCells = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 7; col++) {
                const isDisabled = (

                    (row === 0 && col === 4) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||

                    (row === 1 && col === 5) ||
                    (row === 1 && col === 6) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 6) ||

                    (row === 3 && col === 0) ||
                    (row === 3 && col === 6) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 6) ||

                    (row === 5 && col === 6) ||
                    (row === 5 && col === 5) ||

                    (row === 6 && col === 0) ||
                    (row === 6 && col === 6) ||

                    (row === 7 && col === 0) ||
                    (row === 7 && col === 1) ||

                    (row === 8 && col === 0) ||
                    (row === 8 && col === 1) ||
                    (row === 8 && col === 2) ||
                    (row === 8 && col === 3)
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateMeadowGazeboNorthLayout() {
        const disabledCells = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 20; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 1) ||
                    (row === 0 && col === 2) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 5) ||
                    (row === 0 && col === 6) ||
                    (row === 0 && col === 7) ||
                    (row === 0 && col === 8) ||
                    (row === 0 && col === 14) ||
                    (row === 0 && col === 15) ||
                    (row === 0 && col === 16) ||
                    (row === 0 && col === 17) ||
                    (row === 0 && col === 18) ||
                    (row === 0 && col === 19) ||

                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1) ||
                    (row === 1 && col === 2) ||
                    (row === 1 && col === 3) ||
                    (row === 1 && col === 4) ||
                    (row === 1 && col === 5) ||
                    (row === 1 && col === 6) ||
                    (row === 1 && col === 15) ||
                    (row === 1 && col === 16) ||
                    (row === 1 && col === 17) ||
                    (row === 1 && col === 18) ||
                    (row === 1 && col === 19) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 1) ||
                    (row === 2 && col === 2) ||
                    (row === 2 && col === 3) ||
                    (row === 2 && col === 4) ||
                    (row === 2 && col === 16) ||
                    (row === 2 && col === 17) ||
                    (row === 2 && col === 18) ||
                    (row === 2 && col === 19) ||
 
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
                    (row === 3 && col === 2) ||
                    (row === 3 && col === 18) ||
                    (row === 3 && col === 19) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 8) ||
                    (row === 4 && col === 9) ||
                    (row === 4 && col === 10) ||
                    (row === 4 && col === 11) ||
                    (row === 4 && col === 12) ||
                    (row === 4 && col === 13) ||
                    (row === 4 && col === 19) ||

                    (row === 5 && col === 0) ||
                    (row === 5 && col === 7) ||
                    (row === 5 && col === 8) ||
                    (row === 5 && col === 9) ||
                    (row === 5 && col === 10) ||
                    (row === 5 && col === 11) ||
                    (row === 5 && col === 12) ||
                    (row === 5 && col === 13) ||
                    (row === 5 && col === 14) ||
                    (row === 5 && col === 19) ||

                    
                    (row === 6 && col === 6) ||
                    (row === 6 && col === 7) ||
                    (row === 6 && col === 8) ||
                    (row === 6 && col === 9) ||
                    (row === 6 && col === 10) ||
                    (row === 6 && col === 11) ||
                    (row === 6 && col === 12) ||
                    (row === 6 && col === 13) ||
                    (row === 6 && col === 14) ||
                    (row === 6 && col === 15) ||

                    
                    (row === 7 && col === 5) ||
                    (row === 7 && col === 6) ||
                    (row === 7 && col === 7) ||
                    (row === 7 && col === 8) ||
                    (row === 7 && col === 9) ||
                    (row === 7 && col === 10) ||
                    (row === 7 && col === 11) ||
                    (row === 7 && col === 12) ||
                    (row === 7 && col === 13) ||
                    (row === 7 && col === 14) ||
                    (row === 7 && col === 15) ||
                    (row === 7 && col === 16) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateMeadowGazeboPathWestLayout() {
        const disabledCells = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 11; col++) {
                const isDisabled = (

                    (row === 0 && col === 6) ||
                    (row === 0 && col === 7) ||
                    (row === 0 && col === 8) ||
                    (row === 0 && col === 9) ||
                    (row === 0 && col === 10) ||

                    (row === 1 && col === 6) ||
                    (row === 1 && col === 7) ||
                    (row === 1 && col === 8) ||
                    (row === 1 && col === 9) ||
                    (row === 1 && col === 10) ||

                    (row === 2 && col === 0) ||
                    (row === 2 && col === 7) ||
                    (row === 2 && col === 8) ||
                    (row === 2 && col === 9) ||
                    (row === 2 && col === 10) ||
 
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
                    (row === 3 && col === 8) ||
                    (row === 3 && col === 9) ||
                    (row === 3 && col === 10) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 2) ||
                    (row === 4 && col === 9) ||
                    (row === 4 && col === 10) ||

                    (row === 5 && col === 0) ||
                    (row === 5 && col === 1) ||
                    (row === 5 && col === 2) ||
                    (row === 5 && col === 3) ||
                    (row === 5 && col === 10) ||

                    
                    (row === 6 && col === 0) ||
                    (row === 6 && col === 1) ||
                    (row === 6 && col === 2) ||
                    (row === 6 && col === 3) ||
                    (row === 6 && col === 4) ||

                    (row === 7 && col === 0) ||
                    (row === 7 && col === 1) ||
                    (row === 7 && col === 2) ||
                    (row === 7 && col === 3) ||
                    (row === 7 && col === 4) ||
                    (row === 7 && col === 5) ||
                    (row === 7 && col === 6) ||
                    (row === 7 && col === 7) ||
                    (row === 7 && col === 8) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateMeadowGazeboPathEastLayout() {
        const disabledCells = [];
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 9; col++) {
                const isDisabled = (
                    (row === 0 && col === 7) ||
                    (row === 0 && col === 8) ||

                    (row === 2 && col === 0) ||
 
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 1) ||
                    (row === 3 && col === 8) ||

                    (row === 4 && col === 0) ||
                    (row === 4 && col === 1) ||
                    (row === 4 && col === 7) ||
                    (row === 4 && col === 8) ||

                    (row === 5 && col === 0) ||
                    (row === 5 && col === 1) ||
                    (row === 5 && col === 2) ||
                    (row === 5 && col === 8) ||
                    (row === 5 && col === 7) ||
                    (row === 5 && col === 6) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateMeadowCorralLayout() {
        const disabledCells = [];
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const isDisabled = (
                    (row === 0 && col === 3) ||
                    (row === 1 && col === 0) ||
                    (row === 1 && col === 1)
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    // Other Layout Generators
    generateCloudOuterCabinLayout() {
        const disabledCells = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 6; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 3) ||
                    (row === 0 && col === 4) ||
                    (row === 0 && col === 5) ||
                    (row === 1 && col === 4) ||
                    (row === 1 && col === 5) ||
                    (row === 2 && col === 3) ||
                    (row === 2 && col === 4) ||
                    (row === 2 && col === 5) ||
                    (row === 3 && col === 0) ||
                    (row === 3 && col === 4) ||
                    (row === 3 && col === 5) ||
                    (row === 4 && col === 5) ||
                    (row === 6 && col === 0) ||
                    (row === 7 && col === 0) ||
                    (row === 7 && col === 1) ||
                    (row === 7 && col === 5) 
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateIcyPeakSummitLayout() {
        const disabledCells = [];
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const isDisabled = (
                    (row === 0 && col === 0) ||
                    (row === 0 && col === 3)
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateCrystalCavesLayout() {
        const disabledCells = [];
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 4; col++) {
                const isDisabled = (
                    (row === 0 && col === 3) ||
                    (row === 1 && col === 0)
                );
                if (isDisabled) disabledCells.push({row, col});
            }
        }
        return disabledCells;
    }

    generateTheMoonLayout() {
        const disabledCells = [];
        // No cells are disabled for this layout
        return disabledCells;
    }

    generateWheatflourUpperLeftLayout() {
        const disabledCells = [];
        // No cells are disabled for this layout
        return disabledCells;
    }

    generateWheatflourUpperRightLayout() {
        const disabledCells = [];
        // No cells are disabled for this layout
        return disabledCells;
    }

    generateWheatflourLowerLeftLayout() {
        const disabledCells = [];
        // No cells are disabled for this layout
        return disabledCells;
    }

    generateWheatflourLowerRightLayout() {
        const disabledCells = [];
        // No cells are disabled for this layout
        return disabledCells;
    }

        // Other Layout Generators
        generateCityWestParkLayout() {
            const disabledCells = [];
            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 10; col++) {
                    const isDisabled = (
                        (row === 0 && col === 0) ||
                        (row === 0 && col === 1) ||
                        (row === 0 && col === 2) ||
                        (row === 0 && col === 9) ||
                        (row === 1 && col === 0) ||
                        (row === 5 && col === 0) ||
                        (row === 4 && col === 9) ||
                        (row === 5 && col === 9) ||
                        (row === 5 && col === 8) ||
                        (row === 5 && col === 7) 
                    );
                    if (isDisabled) disabledCells.push({row, col});
                }
            }
            return disabledCells;
        }
    /**
     * Add a custom layout
     */
    addCustomLayout(id, layout) {
        this.customLayouts.set(id, {
            id,
            name: layout.name,
            rows: layout.rows,
            cols: layout.cols,
            disabledCells: layout.disabledCells || []
        });
    }

    /**
     * Get a custom layout by ID
     */
    getCustomLayout(id) {
        return this.customLayouts.get(id);
    }

    /**
     * Get all custom layout IDs
     */
    getAllCustomLayoutIds() {
        return Array.from(this.customLayouts.keys());
    }

    /**
     * Get all custom layout names
     */
    getAllCustomLayoutNames() {
        return Array.from(this.customLayouts.values()).map(layout => layout.name);
    }

    /**
     * Get layout info by name
     */
    getLayoutInfo(layoutName) {
        for (const layout of this.customLayouts.values()) {
            if (layout.name === layoutName) {
                return layout;
            }
        }
        return null;
    }

    /**
     * Set the current custom layout
     */
    setCurrentCustomLayout(layoutId) {
        const layout = this.getCustomLayout(layoutId);
        if (layout) {
            this.currentLayout = layout;
            this.isCustomGridMode = true;
            return true;
        }
        return false;
    }

    /**
     * Clear the current custom layout (return to normal grid)
     */
    clearCurrentCustomLayout() {
        this.currentLayout = null;
        this.isCustomGridMode = false;
    }

    /**
     * Get current grid dimensions
     */
    getCurrentGridDimensions() {
        if (this.currentLayout) {
            return {
                rows: this.currentLayout.rows,
                cols: this.currentLayout.cols
            };
        }
        return null;
    }

    /**
     * Get current disabled cells
     */
    getCurrentDisabledCells() {
        if (this.currentLayout) {
            return this.currentLayout.disabledCells;
        }
        return [];
    }

    /**
     * Check if a cell is disabled in the current layout
     */
    isCellDisabled(row, col) {
        if (!this.currentLayout) return false;
        
        return this.currentLayout.disabledCells.some(cell => 
            cell.row === row && cell.col === col
        );
    }

    /**
     * Toggle a cell's disabled state (only works in custom grid mode)
     */
    toggleDisabledCell(row, col) {
        if (!this.isCustomGridMode || !this.currentLayout) return false;
        
        const cellIndex = this.currentLayout.disabledCells.findIndex(cell => 
            cell.row === row && cell.col === col
        );
        
        if (cellIndex >= 0) {
            // Cell is currently disabled, enable it
            this.currentLayout.disabledCells.splice(cellIndex, 1);
            return false; // Now enabled
        } else {
            // Cell is currently enabled, disable it
            this.currentLayout.disabledCells.push({row, col});
            return true; // Now disabled
        }
    }

    /**
     * Apply custom layout to a grid
     */
    applyCustomLayoutToGrid(grid, createCellElementCallback, updateGridDisplayCallback) {
        if (!this.currentLayout) return;
        
        const { rows, cols, disabledCells } = this.currentLayout;
        
        // Apply disabled cells
        disabledCells.forEach(({row, col}) => {
            if (row < rows && col < cols && grid[row] && grid[row][col]) {
                const cellData = grid[row][col];
                cellData.disabled = true;
                if (cellData.element) {
                    cellData.element.classList.add('disabled');
                    cellData.element.innerHTML = '';
                }
            }
        });
        
        if (updateGridDisplayCallback) {
            updateGridDisplayCallback();
        }
    }

    /**
     * Clear grid while preserving disabled cells
     */
    clearGridPreservingDisabledCells(grid, clearCellCallback) {
        if (!this.currentLayout) {
            // No custom layout, clear everything normally
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const cellData = grid[row][col];
                    if (cellData && !cellData.disabled) {
                        clearCellCallback(cellData);
                    }
                }
            }
        } else {
            // Custom layout active, preserve disabled cells
            const disabledCells = this.getCurrentDisabledCells();
            
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const cellData = grid[row][col];
                    if (cellData) {
                        const isDisabled = disabledCells.some(cell => 
                            cell.row === row && cell.col === col
                        );
                        
                        if (!isDisabled) {
                            clearCellCallback(cellData);
                        }
                    }
                }
            }
        }
    }

    /**
     * Export custom layouts as JSON
     */
    exportCustomLayouts() {
        const layouts = {};
        for (const [id, layout] of this.customLayouts) {
            layouts[id] = {
                name: layout.name,
                rows: layout.rows,
                cols: layout.cols,
                disabledCells: layout.disabledCells
            };
        }
        return JSON.stringify(layouts, null, 2);
    }

    /**
     * Import custom layouts from JSON
     */
    importCustomLayouts(jsonString) {
        try {
            const layouts = JSON.parse(jsonString);
            for (const [id, layout] of Object.entries(layouts)) {
                this.addCustomLayout(id, layout);
            }
            return true;
        } catch (error) {
            console.error('Error importing custom layouts:', error);
            return false;
        }
    }

    /**
     * Create a new custom layout
     */
    createCustomLayout(name, rows, cols, disabledCells = []) {
        const id = `custom_${Date.now()}`;
        this.addCustomLayout(id, {
            name,
            rows,
            cols,
            disabledCells
        });
        return id;
    }

    /**
     * Delete a custom layout
     */
    deleteCustomLayout(layoutId) {
        if (this.customLayouts.has(layoutId)) {
            this.customLayouts.delete(layoutId);
            return true;
        }
        return false;
    }

    /**
     * Get current layout name
     */
    getCurrentLayoutName() {
        return this.currentLayout ? this.currentLayout.name : 'Normal Grid';
    }

    /**
     * Check if currently in custom grid mode
     */
    isInCustomGridMode() {
        return this.isCustomGridMode;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomGridManager;
}
