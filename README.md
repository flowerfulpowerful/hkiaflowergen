# hkiaflowergen
Created by Vi & Collaborators

*Not an official affiliate with Sunblink or Hello Kitty Island Adventure, community project.*

# About
The **[HKIA Flower Generator](https://flowerfulpowerful.github.io/hkiaflowergen/)** allows you to create a replica of your flower plot set-up and view the spawning/growing probabilities for individual flower combinations.

### Features include:
- **Grid-wide & plot-wide actions:** *Use the Clear Plot button to remove all flowers in a grid, or the Paint Tool to disable plots and copy & paste flowers.*
- **Grid Customization:** *Change the size of the grid.*
- - **Auto Plot Generator:** *Use the "Plot Layout" feature in the Grid Customization menu to generate preset flower plot layouts. These flower plot layouts are identical to the ones seen in-game. Selecting the "None" option will allow the user to create their own custom grids (10x10 maximum size).*
- **Percentage View:** *View percentages for individual plots or all plots in a grid.*
- **Percentage Configuration:** *Toggle "Standard" or "Greenhouse" (100%) percentage rates.*
- **Grid Code Export & Import:** *Copy & share (or save) your grid codes, and import them to display a new grid.*
- **Feedback Form:** *Suggest improvements or leave **kind** feedback to help us improve!*


# Tutorials
- **[In-depth tutorial](https://discord.com/channels/1105575633943277629/1274566291264376983/1274793831769837710) on how to use the import/export, percentage toggle, and paint mode**

- **[Info on how percentages work #1](https://discord.com/channels/1105575633943277629/1274566291264376983/1274580948385796097)**
- **[Info on how percentages work #2](https://discord.com/channels/1105575633943277629/1274566291264376983/1274580080323985481)** 

- **[Flower "tips & tricks" graphics](https://discord.com/channels/1105575633943277629/1274566291264376983/1274583662628704361)**

# Updates/Versions

## Updates will now be reported on our [Developer Blog](https://flowerfulpowerful.github.io/hkiaflowergen/blog.html) instead of the README.md file. 

<details>
<summary><h2>Version 1.5.7</h2></summary>

### Updates:
- **Plot Generation:** Fixed incorrectly labeled plot generation options + added new flower plots (i.e. Crystal Caves plot).
- **Added New Flowers & Patterns/Effects:** Added Crystalia and Pinwheel flowers + Crystal effect and Alternate pattern.
- **Invalid Flowers:** Invalid flowers will now have a red outline around their plot.
- **Color jump/Transfer:** Implemented in-game changes where Color jump/transfer couldn't be done to other flowers if it could be reached via their default colors (i.e. lime can't be transferred to bellbutton, since it can be reached from yellow (default)+blue(default)=green(default^2)+white(default)) — **Color jump/transfer will now be possible**.

### Minor Tweaks:
- **Percentage List Changes:** Removed the "None" text so that its just empty if it's "None".
- **Percentage Accuracy:** Fixed the percentages to be as accurate as possible (3 decimal points in specific plot % view)
- **Flower Effects:** Fixed the Effect patterns (Molten wasn't an effect pattern for some reason).
- **Percentage List Changes:** Added a light gray horizontal bar for visual separation between flower percentages.

### Additional Information:
Thank you for your constant feedback for the HKIA Flower Generator. We want to let you know that we do read *all* of your feedback messages! That being said, due to this being a voluntary project, at times changes and updates can be slow. We appreciate your patience, along with your kind words and support!

***Question for HKIA Flower Generator users:*** Would you like us to implement a way to simulate events? Please let us know whether or not you'd like to see this feature added and your ideas on how we can make it happen. You can send a message via the "Feedback" button in the "Settings" menu.
---
</details>

<details>
<summary><h2>Version 1.5.6</h2></summary>

### Updates:
- **Weighted Calculations:** Weighted calculations have been fixed.

### Additional Information:
- Color jump/transfer still can't be done to other flowers if it can be reached via their default colors (i.e. lime can't be transferred to bellbutton, since it can be reached from yellow (default)+blue(default)=green(default^2)+white(default)). This will be changed once the game update that fixes this is live.
---
</details>

<details>
<summary><h2>Version 1.5.5</h2></summary>

### Updates:
- **Added New Flowers:** Added the Happadil + Confetti pattern.

### Additional Information:
- Color jump/transfer still can't be done to other flowers if it can be reached via their default colors (i.e. lime can't be transferred to bellbutton, since it can be reached from yellow (default)+blue(default)=green(default^2)+white(default)). This will be changed once the game update that fixes this is live.

---
</details>

<details>
<summary><h2>Version 1.5.4</h2></summary>

### Updates:
- **Added New Flowers:** Added the Blazebulb + Molten effect.
- **Caldera Plot Layout:** Added the new Caldera plot layout in the Plot Generator.
- **Minor Fixes:** Added missing import/export mapping, Heavy Nettle correct pattern availability

### Additional Information:
- Color jump/transfer still can't be done to other flowers if it can be reached via their default colors (i.e. lime can't be transferred to bellbutton, since it can be reached from yellow (default)+blue(default)=green(default^2)+white(default)). This will be changed once the game update that fixes this is live.

### Work in progress/Incomplete features:
- **Event Toggle:** *A toggle feature (w/in 'Settings' menu) that will represent the 5% event flower spawning chance ONLY during their designated event. The feature will allow the user to turn the 'Event Toggle' ON or OFF (upon page loading, toggle will be OFF) & allow user to select an event, which will then allow the designated event flower's natural spawning percentages to be displayed in the Flower Pecentage display menus.*
- **See [Version 1.0.0](https://github.com/flowerfulpowerful/hkiaflowergen/tree/main?tab=readme-ov-file#version-100) List:** *Continued efforts towards those listed there.*
---
</details>

<details>
<summary><h2>Version 1.5.3</h2></summary>

### Updates:
- **Mobile Compatibility:** We unfortunately had to revert previous changes to mobile compatibility due to a PR.
- Everything should now be working as is was prior to Version 1.5.2; however, the 5% event flower spawning chance in a normal grid flower % display for the H&H event is also removed ([See version 1.5.1](https://github.com/flowerfulpowerful/hkiaflowergen/blob/main/README.md#version-151)).

### Work in progress/Incomplete features:
- **Event Toggle:** *A toggle feature (w/in 'Settings' menu) that will represent the 5% event flower spawning chance ONLY during their designated event. The feature will allow the user to turn the 'Event Toggle' ON or OFF (upon page loading, toggle will be OFF) & allow user to select an event, which will then allow the designated event flower's natural spawning percentages to be displayed in the Flower Pecentage display menus.*
- **Mobile Compatibility:** Back to square one! (Version 1.5.0)
- **Add New Flowers:** Add the Blazebulb + Molten effect.
- **Add New Plot Layout:** Add the Caldera plot to the plot generator.
- **In-game Flower Breeding Changes:** A bug impacting flowers will soon be changed (game version 2.5) — we will be sure to stay on top of any possible changes this may cause to flowers.
- **See [Version 1.0.0](https://github.com/flowerfulpowerful/hkiaflowergen/tree/main?tab=readme-ov-file#version-100) List:** *Continued efforts towards those listed there.*

---
</details>


<details>
<summary><h2>Version 1.5.2</h2></summary>

### Updates:
- **Mobile Compatibility:** *Make larger grids more accessible for smaller devices (maximum grid size: 20x20).*
- - *We added the ability to scroll larger grids so the entire grid can be accessed on mobile devices (450px width or below).*
  - *There are still some issues with mobile devices & smaller grids (See V.1.5.2 "Work in progress/Incomplete features" for more)*
  - ***Additional Information (per susanafotu's [PR](https://github.com/flowerfulpowerful/hkiaflowergen/pull/2))***
  
**Thank you to [susanafotu](https://github.com/susanafotu) for helping with the mobile grid-sizing issue! You rock!!! <3**

### New Feature Notes:
- **Event Flowers:** *[Last version](https://github.com/flowerfulpowerful/hkiaflowergen/blob/main/README.md#version-151) we tried to see how it would work if we implemented the 5% event flower spawning chance in a normal grid flower % display. We've taken in the feedback and are working on creating a toggle feature for events. See V.1.5.2 "Work in progress/Incomplete features" for more information about this.*

### Work in progress/Incomplete features:
- **Event Toggle:** *A toggle feature (w/in 'Settings' menu) that will represent the 5% event flower spawning chance ONLY during their designated event. The feature will allow the user to turn the 'Event Toggle' ON or OFF (upon page loading, toggle will be OFF) & allow user to select an event, which will then allow the designated event flower's natural spawning percentages to be displayed in the Flower Pecentage display menus.*
- **Mobile Compatibility:** *Make smaller grids (1x1 until 5x5 grid size) look less janky/spaced out on smaller devices (450px width or below).*
- **See [Version 1.0.0](https://github.com/flowerfulpowerful/hkiaflowergen/tree/main?tab=readme-ov-file#version-100) List:** *Continued efforts towards those listed there.*

---
</details>


<details>
<summary><h2>Version 1.5.1</h2></summary>

### Updates:
- **List of Flowers:** *Added Rose + their pattern to the generator.*
### New Feature Notes:
- **Event Flowers:** *Event flowers have 5% spawn chance outside of the Greenhouse ONLY during events. We currently don't calculate the 5% when the Greenhouse Toggle is OFF; however, we are brainstorming a possible feature that will represent this 5% spawning chance ONLY during events.*
- - Additionally, since it's the H&H event, Rose spawn % will appear when the Greenhouse Toggle is OFF, but not other event flowers. This is a ***temporary*** feature that will be removed when H&H is over—we're just testing out the feature atm!

---
</details>



## Version 1.5.0
### Updates:
- **Added Auto Plot Generator (Feature):** *Use the "Plot Layout" feature in the Grid Customization menu to generate preset flower plot layouts. These flower plot layouts are identical to the ones seen in-game. Selecting the "None" option will allow the user to create their own custom grids (10x10 maximum size).*
- **Added New Audio SFX:** *Updated the SFX for the "Exit" buttons & added a sound during Paint Mode (when the user presses on a square/cell).*
- **Bug Fixes:** *Fixed minor bugs and continued to improve mobile user support (though a continued effort).*
### Work in progress/Incomplete features:
- **See [Version 1.0.0](https://github.com/flowerfulpowerful/hkiaflowergen/tree/main?tab=readme-ov-file#version-100) List:** *Continued efforts towards those listed there.*
- **Mobile Compatibility:** *Make larger grids more accessible for smaller devices (maximum grid size: 20x20).* <sub><sup> *I'm struggling to do this so if anyone can offer insight, please send a message in "Issues" <3* <sub><sup>

---

<details>
<summary><h2>Version 1.0.6</h2></summary>

### Updates:
- **Update List of Flowers:** *Added Frostfeather + their pattern to the generator.*

---
</details>

<details>
<summary><h2>Version 1.0.5</h2></summary>

### Updates:
- **Update List of Flowers:** *Added Bowblossom, Dreampuff, Glowbal, Petunia, Poinsettia + their patterns to the generator.*

---
</details>



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
