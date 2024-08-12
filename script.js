let tutorialImages = ['assets/tutorial1.png', 'assets/tutorial2.png', 'assets/tutorial3.png'];
let currentTutorial = 0;

// Tutorial Button
document.getElementById("tutorialButton").addEventListener("click", function() {
    const popup = document.getElementById("tutorialPopup");
    popup.classList.add("show");
});

// Tutorial Exit Button
document.getElementById("tutorialExitButton").addEventListener("click", function() {
    const popup = document.getElementById("tutorialPopup");
    popup.classList.remove("show");
});

// Tutorial Next Button
document.getElementById("nextButton").addEventListener("click", function() {
    currentTutorial++;
    if (currentTutorial >= tutorialImages.length) {
        currentTutorial = 0;
    }
    document.getElementById("tutorialImage").src = tutorialImages[currentTutorial];
});

// About Button
document.getElementById("aboutButton").addEventListener("click", function() {
    const popup = document.getElementById("aboutPopup");
    popup.classList.add("show");
});

// About Exit Button
document.getElementById("aboutExitButton").addEventListener("click", function() {
    const popup = document.getElementById("aboutPopup");
    popup.classList.remove("show");
});




document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('flower-grid');
    const popupForm = document.getElementById('popup-form');
    const closePopup = document.getElementById('close-popup');
    const clearButton = document.getElementById('clearButton');
    const possibleFlowersPopup = document.getElementById('possible-flowers-popup');
    const closePossibleFlowers = document.getElementById('possibleflowerExitButton');
    const possibleFlowersList = document.getElementById('possible-flowers-list');
    const breedablePopup = document.getElementById('breedable-popup');
    const closeBreedablePopup = document.getElementById('breedableExitButton');
    const selectButton = document.getElementById('selectButton');
    const percentageButton = document.getElementById('percentButton');
    const breedablePopupContent = document.getElementById('breedable-popup-content');
    let activeSquare;

    // Clear Button
    document.getElementById("clearButton").addEventListener("click", function() {
        document.getElementById("flower-form").reset();
    });

    // Submit Button
    document.getElementById("submitButton").addEventListener("click", function() {
        // Handle form submission logic
        const popup = document.getElementById("popup-form");
        // console.log("submit pressed")
        popup.classList.remove("show");
        
        const flowerType = document.getElementById('flower-type').value;
        const flowerMainColor = document.getElementById('flower-main-color').value;
        const flowerPattern = document.getElementById('flower-pattern').value;
        const flowerSecondaryColor = document.getElementById('flower-secondary-color').value;

        const flowerData = {
            type: flowerType,
            mainColor: flowerMainColor,
            pattern: flowerPattern,
            secondaryColor: flowerSecondaryColor
        };

        activeSquare.textContent = `${flowerType}, ${flowerMainColor}, ${flowerPattern}, ${flowerSecondaryColor}`;
        activeSquare.setAttribute('data-flower', JSON.stringify(flowerData));
        
        updateBreedableSquares();
        breedCalc();
    });

    // flower main color defaults
    const flowerMainColorDefaults = {
        "Bellbutton": ["Yellow", "Blue", "White"],
        "Dandelily": ["Red", "Yellow", "White"],
        "Penstemum": ["Green", "Sky", "White"],
        "Tulias": ["Red", "Yellow", "Violet"],
        "Hibiscus": ["Hot Pink"],
        "Ghostgleam": ["White"],
        "Anemone": ["Lime", "Magenta"],
        "Thistle": ["Violet"],
        "Heavy Nettle": ["Orange"],
        "Marigold": ["Orange"],
        "Eggwort": ["Sky", "White"],
        "Petunia": ["Unknown"]
    };

    // flower mixing color combinations
    const color_combinations = {
        "Red,Orange": "Coral",
        "Red,Yellow": "Orange",
        "Yellow,Green": "Lime",
        "Blue,Yellow": "Green",
        "Green,Sky": "Teal",
        "Violet,Blue": "Indigo",
        "Red,Blue": "Violet",
        "Violet,Hot Pink": "Magenta",
        "White,Red": "Warm Pink",
        "White,Coral": "Blush",
        "White,Orange": "Peach",
        "White,Yellow": "Cream",
        "White,Lime": "Pistachio",
        "White,Green": "Mint",
        "White,Teal": "Seafoam",
        "White,Sky": "Cloud",
        "White,Blue": "Ice",
        "White,Indigo": "Periwinkle",
        "White,Violet": "Lilac",
        "White,Hot Pink": "Cool Pink",
        "White,Magenta": "Pink",
    }    

    // TO-DO add list for event flowers

    // Create grid
    for (let i = 0; i < 100; i++) {
        const gridSquare = document.createElement('div');
        gridSquare.addEventListener('click', () => handleSquareClick(gridSquare));
        gridSquare.addEventListener('mouseover', () => showHoverButtons(gridSquare));
        gridSquare.addEventListener('mouseout', () => hideHoverButtons(gridSquare));
        grid.appendChild(gridSquare);
    }

    function handleSquareClick(square) {
        if (square.classList.contains('breedable')) {
            console.log("clicked breedable square")
            openBreedablePopup(square);
        } else {
            openPopup(square);
        }
    }

    // Open flower data popup
    function openPopup(square) {
        activeSquare = square;
        const data = square.getAttribute('data-flower');
        if (data) {
            const flower = JSON.parse(data);
            document.getElementById('flower-type').value = flower.type;
            document.getElementById('flower-main-color').value = flower.mainColor;
            document.getElementById('flower-pattern').value = flower.pattern;
            document.getElementById('flower-secondary-color').value = flower.secondaryColor;
        }
        console.log("flower clicked")
        console.log(popupForm)
        popupForm.classList.add("show");
        popupForm.style.display = 'block';
    }

    // Close flower data popup
    closePopup.addEventListener('click', () => {
        popupForm.classList.remove("show");
        // popupForm.style.display = 'none';
    });

    // // Handle form submission
    // document.getElementById('flower-form').addEventListener('submit', (e) => {
    //     e.preventDefault();

    //     const flowerType = document.getElementById('flower-type').value;
    //     const flowerMainColor = document.getElementById('flower-main-color').value;
    //     const flowerPattern = document.getElementById('flower-pattern').value;
    //     const flowerSecondaryColor = document.getElementById('flower-secondary-color').value;

    //     const flowerData = {
    //         type: flowerType,
    //         mainColor: flowerMainColor,
    //         pattern: flowerPattern,
    //         secondaryColor: flowerSecondaryColor
    //     };

    //     activeSquare.textContent = `${flowerType}, ${flowerMainColor}, ${flowerPattern}, ${flowerSecondaryColor}`;
    //     activeSquare.setAttribute('data-flower', JSON.stringify(flowerData));
        
    //     updateBreedableSquares();
    //     breedCalc();
    //     popupForm.classList.remove("show");
    //     popupForm.style.display = 'none';
    // });

    // Clear button action
    clearButton.addEventListener('click', () => {
        activeSquare.textContent = '';
        activeSquare.removeAttribute('data-flower');
        updateBreedableSquares();
        breedCalc();
        popupForm.style.display = 'none';
    });

    // Show hover buttons
    function showHoverButtons(square) {
        if (square.hasAttribute('data-flower')) {
            square.classList.add('hovered');
        }
    }

    // Hide hover buttons
    function hideHoverButtons(square) {
        square.classList.remove('hovered');
    }

    // Update breedable squares
    function updateBreedableSquares() {
        const squares = document.querySelectorAll('.grid div');
        
        // Clear previous breedable class and parents-list attributes
        squares.forEach(square => {
            square.classList.remove('breedable');
            square.removeAttribute('parents-list');
            square.removeAttribute('children-list');
        });
    
        const flowerSquares = Array.from(squares).filter(square => square.hasAttribute('data-flower'));
        
        flowerSquares.forEach(square => {
            const index = Array.from(grid.children).indexOf(square);
            const neighbors = getNeighbors(index);
    
            neighbors.forEach(neighbor => {
                neighbor.classList.add('breedable');
                
                let parents_list = neighbor.getAttribute('parents-list');
                parents_list = parents_list ? JSON.parse(parents_list) : [];
                console.log('Initial parents_list for neighbor:', parents_list);
    
                if (!parents_list.includes(index)) {
                    parents_list.push(index);
                    console.log('Added influencing index:', index);
                } else {
                    console.log('Index already present:', index);
                }
    
                neighbor.setAttribute('parents-list', JSON.stringify(parents_list));
                console.log('Updated parents_list for neighbor:', neighbor.getAttribute('parents-list'));
            });
        });

        const breedableSquares = document.querySelectorAll('.grid div.breedable');
        breedableSquares.forEach(square => {
            console.log('Breedable Square:', {
                element: square,
                textContent: square.textContent,
                parentsList: square.getAttribute('parents-list')
            });
        });
    }
    
    // unique pairs of parents
    function combinations(array, size) {
        const result = [];
        const combine = (start, combo) => {
            if (combo.length === size) {
                result.push(combo);
                return;
            }
            for (let i = start; i < array.length; i++) {
                combine(i + 1, combo.concat(array[i]));
            }
        };
        combine(0, []);
        return result;
    }

    // get the data-flower data at that index
    function findSquareByIndex(index) {
        if (index >= 0 && index < grid.children.length) {
            const square = grid.children[index]
            const data = square.getAttribute('data-flower');
            return data ? JSON.parse(data) : null;
        }
        return null;
    }

    // get two colors and it should return the resulting mix
    function color_mix(color1, color2) {
        // Construct both possible keys
        const key1 = `${color1},${color2}`;
        const key2 = `${color2},${color1}`;
    
        // Check for the value in both keys
        return color_combinations[key1] !== undefined ? color_combinations[key1] :
            color_combinations[key2] !== undefined ? color_combinations[key2] : 
                null;
    }

    // turn flower into non patterned with a specific weight
    function non_patterned(flowerData, weight) {
        flowerData.pattern = "None"
        flowerData.secondaryColor = "None"
        flowerData.weight = weight
        return flowerData
    }

    
    function calc_probabilities(children_list) {
        const groupedOutcomes = {};
    
        children_list.forEach(flower => {
            const key = `${flower.type}-${flower.mainColor}-${flower.pattern}-${flower.secondaryColor}`;
            if (groupedOutcomes[key]) {
                groupedOutcomes[key].weight += flower.weight; // Combine weights
            } else {
                groupedOutcomes[key] = { ...flower }; // Initialize entry
            }
        });
    
        const totalWeight = Object.values(groupedOutcomes).reduce((sum, flower) => sum + flower.weight, 0);
    
        // Calculate and log the probability of each unique outcome
        const probabilities = Object.values(groupedOutcomes).map((flower, i) => {
            const probability = flower.weight / totalWeight;
            console.log(`Outcome: ${flower.type}, ${flower.mainColor}, ${flower.secondaryColor}, ${flower.pattern} , Probability: ${(probability * 100).toFixed(2)}%`);
            return { ...flower, probability: probability }; // Return a new object with the probability included
        });
        // console.log(probabilities)
        return probabilities; 
    }

    // Breed calculation, called after updateBreedableSquares
    function breedCalc() {
        const seed_locs = document.querySelectorAll('.grid div.breedable');
        seed_locs.forEach(square => {
            const parents_list_attr = square.getAttribute('parents-list');
            // const children_list_attr = square.getAttribute('children-list');
            // const seed_loc = square
            const children_list = [];
            let flowerData = null;
            // console.log(seed_loc)
            if (parents_list_attr !== null) {
                const parents_list = JSON.parse(parents_list_attr);
                console.log(parents_list.length)
                if (parents_list.length === 1) { // only one parent 
                    const solo_parent = findSquareByIndex(parents_list[0])
                    if (solo_parent.pattern === "None"){ // one parent, no pattern
                        solo_parent.weight = 1
                        flowerData = solo_parent
                    }
                    else { // one parent, patterned
                        const non_patterned_child_clone = non_patterned(structuredClone(solo_parent), 0.8) // deep copy
                        const patterned_child_clone = structuredClone(solo_parent)
                        patterned_child_clone.weight = 0.2
                        console.log(non_patterned_child_clone)
                        children_list.push(non_patterned_child_clone)
                        children_list.push(patterned_child_clone)
                        flowerData = null;
                    }
                    if (flowerData) {
                        children_list.push(flowerData);
                    }
                }
                const pairs = combinations(parents_list, 2);
                pairs.forEach(([pair_1, pair_2]) => {
                    // console.log(`Pair: ${findSquareByIndex(parent_1).type}, ${findSquareByIndex(parent_2)}`);
                    const parent_1 = findSquareByIndex(pair_1)
                    const parent_2 = findSquareByIndex(pair_2)
                    console.log(`parent_1 ${parent_1.type} ${parent_1.mainColor} ${parent_1.pattern} ${parent_1.secondaryColor}`)
                    console.log(`parent_2 ${parent_2.type} ${parent_2.mainColor} ${parent_2.pattern} ${parent_2.secondaryColor}`)
                    console.log(`mixing ${parent_1.mainColor} + ${parent_2.mainColor} = ${color_mix(parent_1.mainColor,parent_2.mainColor)}`)
                    flowerData = {
                        type:"type1",
                        mainColor:color_mix(parent_1.mainColor,parent_2.mainColor),
                        pattern:"pattern1",
                        secondaryColor: "secondarycolor1"
                    }
                    if ((parent_1.type === parent_2.type)) { // pair same type
                        if (parent_1.mainColor === parent_2.mainColor) { // pair same type and same color
                            // doesn't matter if there is pattern or not
                            // there should at least be a patterned clone chance here, but there isn't :(
                            children_list.push(non_patterned(structuredClone(parent_1), 1))
                        }
                        if (parent_1.mainColor !== parent_2.mainColor) {
                            if ((parent_1.pattern !== "None") && (parent_2.pattern !== "None")) { // pair same type and differing colors and both patterned
                                //check if can mix
                                const mixed_child_color = color_mix(parent_1.mainColor, parent_2.mainColor)
                                if (mixed_child_color) {
                                    mixed_child_seedling = non_patterned(structuredClone(parent_1), 0.20)
                                    mixed_child_seedling.mainColor = mixed_child_color
                                    children_list.push(mixed_child_seedling)

                                    non_patterned_child_1_clone = non_patterned(structuredClone(parent_1), 0.30)
                                    non_patterned_child_2_clone = non_patterned(structuredClone(parent_2), 0.30)
                                    children_list.push(non_patterned_child_1_clone)
                                    children_list.push(non_patterned_child_2_clone)

                                    patterned_child_1_clone = structuredClone(parent_1)
                                    patterned_child_1_clone.weight = 0.04
                                    patterned_child_2_clone = structuredClone(parent_2)
                                    patterned_child_2_clone.weight = 0.04
                                    children_list.push(patterned_child_1_clone)
                                    children_list.push(patterned_child_2_clone)
                                    // secondary takes other's main
                                    mix_1_swap = structuredClone(parent_1)
                                    mix_2_swap = structuredClone(parent_2)
                                    mix_1_swap.secondaryColor = parent_2.mainColor
                                    mix_2_swap.secondaryColor = parent_1.mainColor
                                    mix_1_swap.weight = 0.01
                                    mix_2_swap.weight = 0.01
                                    children_list.push(mix_1_swap)
                                    children_list.push(mix_2_swap)
                                }
                                //if can't mix
                                else {
                                    non_patterned_child_1_clone = non_patterned(structuredClone(parent_1), 0.46)
                                    non_patterned_child_2_clone = non_patterned(structuredClone(parent_2), 0.46)
                                    children_list.push(non_patterned_child_1_clone)
                                    children_list.push(non_patterned_child_2_clone)

                                    patterned_child_1_clone = structuredClone(parent_1)
                                    patterned_child_1_clone.weight = 0.03
                                    patterned_child_2_clone = structuredClone(parent_2)
                                    patterned_child_2_clone.weight = 0.03
                                    children_list.push(patterned_child_1_clone)
                                    children_list.push(patterned_child_2_clone)
                                    // secondary takes other's main
                                    mix_1_swap = structuredClone(parent_1)
                                    mix_2_swap = structuredClone(parent_2)
                                    mix_1_swap.secondaryColor = parent_2.mainColor
                                    mix_2_swap.secondaryColor = parent_1.mainColor
                                    mix_1_swap.weight = 0.01
                                    mix_2_swap.weight = 0.01
                                    children_list.push(mix_1_swap)
                                    children_list.push(mix_2_swap)
                                }
                            }
                            else { // one or no pattern
                                // check if can mix
                                const mixed_child_color = color_mix(parent_1.mainColor, parent_2.mainColor)
                                if (mixed_child_color) {
                                    mixed_child_seedling = non_patterned(structuredClone(parent_1), 0.30)
                                    mixed_child_seedling.mainColor = mixed_child_color
                                    children_list.push(mixed_child_seedling)

                                    non_patterned_child_1_clone = non_patterned(structuredClone(parent_1), 0.35)
                                    non_patterned_child_2_clone = non_patterned(structuredClone(parent_2), 0.35)
                                    children_list.push(non_patterned_child_1_clone)
                                    children_list.push(non_patterned_child_2_clone)

                                    if (parent_1.pattern !== "None") {
                                        patterned_child_1_clone = structuredClone(parent_1)
                                        patterned_child_1_clone.weight = 0.01
                                        children_list.push(patterned_child_1_clone)
                                    }
                                    if (parent_2.pattern !== "None") {
                                        patterned_child_2_clone = structuredClone(parent_2)
                                        patterned_child_2_clone.weight = 0.01
                                        children_list.push(patterned_child_2_clone)
                                    }
                                }
                                // if can't mix
                                else {
                                    if (parent_1.pattern !== "None") {
                                        non_patterned_child_1_clone = non_patterned(structuredClone(parent_1), 0.8)
                                        children_list.push(non_patterned_child_1_clone)
                                        patterned_child_1_clone = structuredClone(parent_1)
                                        patterned_child_1_clone.weight = 0.20
                                        children_list.push(patterned_child_1_clone)
                                    }
                                    else {
                                        children_list.push(non_patterned(structuredClone(parent_1), 1))
                                    }
                                    if (parent_2 !== "None") {
                                        non_patterned_child_2_clone = non_patterned(structuredClone(parent_2), 0.8)
                                        children_list.push(non_patterned_child_2_clone)
                                        patterned_child_2_clone = structuredClone(parent_2)
                                        patterned_child_2_clone.weight = 0.20
                                        children_list.push(patterned_child_2_clone)
                                    }
                                    else {
                                        children_list.push(non_patterned(structuredClone(parent_1), 1))
                                    }
                                }
                            }
                        }
                    }


                    if((parent_1.type !== parent_2.type) && ((parent_1.pattern !== "None") || (parent_2.pattern !== "None") )) { // diff type and at least one patterned

                        if (parent_1.mainColor === parent_2.mainColor){

                            console.log("pair is diff type and same color and at least one is patterned")
                            console.log("pattern transfer")
                            non_patterned_child_1_clone = non_patterned(structuredClone(parent_1), 0.48)
                            non_patterned_child_2_clone = non_patterned(structuredClone(parent_2), 0.48)

                            children_list.push(non_patterned_child_1_clone)
                            children_list.push(non_patterned_child_2_clone)

                            if (parent_1.pattern !== "None"){
                                patterned_parent_1_clone = structuredClone(parent_1)
                                patterned_parent_1_clone.weight = 0.03
                                
                                swap_type = structuredClone(parent_1)
                                swap_type.type = parent_2.type
                                swap_type.weight = 0.01

                                children_list.push(patterned_parent_1_clone)
                                children_list.push(swap_type)
                            }
                            if (parent_2.pattern !== "None"){
                                patterned_parent_2_clone = structuredClone(parent_2)
                                patterned_parent_2_clone.weight = 0.03

                                swap_type = structuredClone(parent_2)
                                swap_type.type = parent_1.type
                                swap_type.weight = 0.01

                                children_list.push(patterned_parent_2_clone)
                                children_list.push(swap_type)
                            }
                        }
                        else {
                            console.log("pair is diff type and has diff main color and at least one patterned")
                            console.log("color transfer")
                            non_patterned_child_1_clone = non_patterned(structuredClone(parent_1), 0.45)
                            non_patterned_child_2_clone = non_patterned(structuredClone(parent_2), 0.45)

                            children_list.push(non_patterned_child_1_clone)
                            children_list.push(non_patterned_child_2_clone)
                            const parent_1_defaults = flowerMainColorDefaults[parent_1.type]
                            const parent_2_defaults = flowerMainColorDefaults[parent_2.type]

                            if ((parent_1.pattern !== "None") && !(parent_2_defaults.includes(parent_1.mainColor))){
                                swap_type = {
                                    type: parent_2.type,
                                    mainColor: parent_1.mainColor,
                                    pattern: "None",
                                    secondaryColor: "None",
                                    weight: 0.1
                                }
                                children_list.push(swap_type)
                            }
                            if ((parent_2.pattern !== "None") && !(parent_1_defaults.includes(parent_2.mainColor))){
                                swap_type = {
                                    type: parent_1.type,
                                    mainColor: parent_2.mainColor,
                                    pattern: "None",
                                    secondaryColor: "None",
                                    weight: 0.1
                                }
                                children_list.push(swap_type)
                            }
                        }
                    }

                    
                });

                console.log(children_list)
                square.setAttribute('children-list', JSON.stringify(children_list)) // do I need to add the current index of the square, or is the list of children already accessible via the square?
            }
        });
    }


    // Get neighbor squares
    function getNeighbors(index) {
        const neighbors = [];
        const gridSize = 10; // chanhge this if modular grid

        const row = Math.floor(index / gridSize);
        const col = index % gridSize;

        const positions = [
            { r: -1, c: 0 },  // top
            { r: 1, c: 0 },   // bottom
            { r: 0, c: -1 },  // left
            { r: 0, c: 1 },   // right
            { r: -1, c: -1 }, // top-left
            { r: -1, c: 1 },  // top-right
            { r: 1, c: -1 },  // bottom-left
            { r: 1, c: 1 }    // bottom-right
        ];
    

        positions.forEach(pos => {
            const newRow = row + pos.r;
            const newCol = col + pos.c;
            if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                const neighborIndex = newRow * gridSize + newCol;
                console.log("neighbor index " + neighborIndex);
    
                const neighborSquare = grid.children[neighborIndex];
                if (!neighborSquare.hasAttribute('data-flower')) {
                    neighbors.push(neighborSquare);
                }
            }
        });

        return neighbors;
    }

    // Open breedable square options popup
    function openBreedablePopup(square) {
        activeSquare = square;
        breedablePopup.classList.add("show");
        // breedablePopup.style.display = 'flex';
    }

    // Handle Select and Percentage button clicks
    selectButton.addEventListener('click', () => {
        openPopup(activeSquare);
        breedablePopup.classList.remove("show");
    });

    percentageButton.addEventListener('click', () => {
        console.log("percentage clicked")
        // console.log(activeSquare)
        breedablePopup.classList.remove("show");
        showPossibleFlowersPopup();
        
    });


    function flattenJSON(data) {
        const result = {};
    
        function recurse(cur, prop) {
            if (Object(cur) !== cur) {
                result[prop] = cur;
            } else if (Array.isArray(cur)) {
                for (let i = 0; i < cur.length; i++) {
                    recurse(cur[i], prop ? `${prop}[${i}]` : `${i}`);
                }
            } else {
                let isEmpty = true;
                for (const p in cur) {
                    isEmpty = false;
                    recurse(cur[p], prop ? `${prop}.${p}` : p);
                }
                if (isEmpty && prop) result[prop] = {};
            }
        }
    
        recurse(data, "");
        return result;
    }

    // Show possible flowers
    function showPossibleFlowersPopup() {
        // console.log("show possible "+activeSquare )
        // possibleFlowersPopup.style.display = 'flex';
        // overall grid
        // possibleFlowersPopup.style.display = ''; 
        // const allChildren = Array.from(grid.children).filter(square => square.classList.contains('breedable')).flatMap(square => {
        //     const data = square.getAttribute('children-list');
        //     return data ? JSON.parse(data) : [];
        // });
        // console.log(allChildren)
        // const probabilities = calc_probabilities(allChildren);
        const probabilities = calc_probabilities(JSON.parse(activeSquare.getAttribute('children-list')))
        

        possibleFlowersList.innerHTML = probabilities.map(flower => {
            const probability = (flower.probability * 100).toFixed(2);
            return `<li>${flower.type} (${flower.mainColor}, ${flower.pattern}, ${flower.secondaryColor}): ${probability}%</li>`;
        }).join('');
        possibleFlowersPopup.classList.add("show");
    }

    closePossibleFlowers.addEventListener('click', () => {
        possibleFlowersPopup.classList.remove("show");
        // possibleFlowersPopup.style.display = 'none';
        // possibleFlowersList.innerHTML = ''
    });

    closeBreedablePopup.addEventListener('click', () => {
        breedablePopup.classList.remove("show");
        // breedablePopup.style.display = 'none';
        
    });

// All Flowers Button
document.getElementById("allflowersButton").addEventListener("click", function() {
    const popup = document.getElementById("all-possible-flowers-popup");
           // possibleFlowersPopup.style.display = ''; 
   const allChildren = Array.from(grid.children).filter(square => square.classList.contains('breedable')).flatMap(square => {
       const data = square.getAttribute('children-list');
       return data ? JSON.parse(data) : [];
   });
   console.log(allChildren)
   const probabilities = calc_probabilities(allChildren);
   

   document.getElementById('all-possible-flowers-list').innerHTML = probabilities.map(flower => {
       const probability = (flower.probability * 100).toFixed(2);
       return `<li>${flower.type} (${flower.mainColor}, ${flower.pattern}, ${flower.secondaryColor}): ${probability}%</li>`;
   }).join('');
   popup.classList.add("show");
    });

    // All Flowers Exit Button
    document.getElementById("allflowersExitButton").addEventListener("click", function() {
    const popup = document.getElementById("all-possible-flowers-popup");
        popup.classList.remove("show");
    });

});
