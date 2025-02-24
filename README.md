# hkiaflowergen
Created by Vi & Collaborators

*Not an official affiliate with Sunblink or Hello Kitty Island Adventure, community project.*

## About
The **[HKIA Flower Generator](https://flowerfulpowerful.github.io/hkiaflowergen/)** allows you to create a replica of your flower plot set-up and view the spawning/growing probabilities for individual flower combinations.

### Features include:
- **Grid-wide & plot-wide actions:** *Use the Clear Plot button to remove all flowers in a grid, or the Paint Tool to disable plots and copy & paste flowers.*
- **Grid Customization:** *Change the size of the grid.*
- <sub><sup> **Auto Plot Generator:** *Use the "Plot Layout" feature in the Grid Customization menu to generate preset flower plot layouts. These flower plot layouts are identical to the ones seen in-game. Selecting the "None" option will allow the user to create their own custom grids (10x10 maximum size).* <sub><sup>
- **Percentage View:** *View percentages for individual plots or all plots in a grid.*
- **Percentage Configuration:** *Toggle "Standard" or "Greenhouse" (100%) percentage rates.*
- **Grid Code Export & Import:** *Copy & share (or save) your grid codes, and import them to display a new grid.*
- **Feedback Form:** *Suggest improvements or leave **kind** feedback to help us improve!*


## Tutorials
- **[In-depth tutorial](https://discord.com/channels/1105575633943277629/1274566291264376983/1274793831769837710) on how to use the import/export, percentage toggle, and paint mode**

- **[Info on how percentages work #1](https://discord.com/channels/1105575633943277629/1274566291264376983/1274580948385796097)**
- **[Info on how percentages work #2](https://discord.com/channels/1105575633943277629/1274566291264376983/1274580080323985481)** 

- **[Flower "tips & tricks" graphics](https://discord.com/channels/1105575633943277629/1274566291264376983/1274583662628704361)**

## Version 1.5.2
### Updates:
- **Mobile Compatibility:** *Make larger grids more accessible for smaller devices (maximum grid size: 20x20). We added the ability to scroll larger grids so the entire grid can be accessed on mobile devices (450px width or below).*
  
**Thank you to [susanafotu](https://github.com/susanafotu) for helping with the mobile grid-sizing issue! You rock!!! <3**

### New Feature Notes:
- **Event Flowers:** *Last version we tried to see how it would work if we implemented the 5% event flower spawning chance in a normal grid flower % display. We've taken in the feedback and are working on creating a toggle feature for events. See V.1.5.2 "[Work in progress/Incomplete features](https://github.com/flowerfulpowerful/hkiaflowergen?tab=readme-ov-file#work-in-progressincomplete-features)" for more information about this.*

#### Additional Information (per susanafotu's [PR](https://github.com/flowerfulpowerful/hkiaflowergen/pull/2))
- moves phone layout CSS to be nested under declaration of grid class name (improves separation of concerns and IMO makes the stylings easier to update)
- adds a `.grid-container` wrapper div + styling
- updates how width is calculated for grid
- *chore: fix width so it fits smaller grids*

### Work in progress/Incomplete features:
- **Event Toggle:** *A toggle feature (w/in 'Settings' menu) that will represent the 5% event flower spawning chance ONLY during their designated event. The feature will allow the user to turn the 'Event Toggle' ON or OFF (upon page loading, toggle will be OFF) & allow user to select an event, which will then allow the designated event flower's natural spawning percentages to be displayed in the Flower Pecentage display menus.*
- **Mobile Compatibility:** *Make smaller grids (1x1 until 5x5 grid size) look less janky/spaced out on smaller devices (450px width or below).*
- **See [Version 1.0.0](https://github.com/flowerfulpowerful/hkiaflowergen/tree/main?tab=readme-ov-file#version-100) List:** *Continued efforts towards those listed there.*

## Version 1.5.1
### Updates:
- **List of Flowers:** *Added Rose + their pattern to the generator.*
### New Feature Notes:
- **Event Flowers:** *Event flowers have 5% spawn chance outside of the Greenhouse ONLY during events. We currently don't calculate the 5% when the Greenhouse Toggle is OFF; however, we are brainstorming a possible feature that will represent this 5% spawning chance ONLY during events.*
- - Additionally, since it's the H&H event, Rose spawn % will appear when the Greenhouse Toggle is OFF, but not other event flowers. This is a ***temporary*** feature that will be removed when H&H is over—we're just testing out the feature atm!

## Version 1.5.0
### Updates:
- **Added Auto Plot Generator (Feature):** *Use the "Plot Layout" feature in the Grid Customization menu to generate preset flower plot layouts. These flower plot layouts are identical to the ones seen in-game. Selecting the "None" option will allow the user to create their own custom grids (10x10 maximum size).*
- **Added New Audio SFX:** *Updated the SFX for the "Exit" buttons & added a sound during Paint Mode (when the user presses on a square/cell).*
- **Bug Fixes:** *Fixed minor bugs and continued to improve mobile user support (though a continued effort).*
### Work in progress/Incomplete features:
- **See [Version 1.0.0](https://github.com/flowerfulpowerful/hkiaflowergen/tree/main?tab=readme-ov-file#version-100) List:** *Continued efforts towards those listed there.*
- ~~**Mobile Compatibility:** *Make larger grids more accessible for smaller devices (maximum grid size: 20x20).* <sub><sup> *I'm struggling to do this so if anyone can offer insight, please send a message in "Issues" <3* <sub><sup>~~

## Version 1.0.6
### Updates:
- **Update List of Flowers:** *Added Frostfeather + their pattern to the generator.*

## Version 1.0.5
### Updates:
- **Update List of Flowers:** *Added Bowblossom, Dreampuff, Glowbal, Petunia, Poinsettia + their patterns to the generator.*

## Version 1.0.0
### Features include:
- **Grid-wide & plot-wide actions:** *Use the Clear Plot button to remove all flowers in a grid, or the Paint Tool to disable plots and copy & paste flowers.*
- **Grid Customization:** *Change the size of the grid.*
- **Percentage View:** *View percentages for individual plots or all plots in a grid.*
- **Percentage Configuration:** *Toggle "Standard" or "Greenhouse" (100%) percentage rates.*
- **Grid Code Export & Import:** *Copy & share (or save) your grid codes, and import them to display a new grid.*
- **Feedback Form:** *Suggest improvements or leave **kind** feedback to help us improve!*
### Work in progress/Incomplete features:
- **Create a Flower (Feature):** *Input desired flower data, then grid will generate best flower combination to generate that flower.*
- **Tips & Tricks (Page):** *A page that includes tips & tricks for flowers + more indepth tutorials for using the flower generator.*
- ~~**Update List of Flowers:** *Add Bowblossom, Glowbal, Petunia + their patterns to the generator.*~~
- **Provide unofuscated code:** *May be done in the future.*
- **General QOL features:** *May be done in the future.*
