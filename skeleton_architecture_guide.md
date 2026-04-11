# Skeleton UI & Loading State Architecture

This document breaks down the implementation of the skeleton loading state, focusing on the CSS techniques and the JavaScript logic used to control it. Building skeleton screens correctly is an important pattern in modern frontend development because it improves perceived performance without jumping the UI layout around.

---

## Part 1: CSS Architecture

The core philosophy of this implementation is **state-driven styling**. Rather than manually creating duplicate "skeleton" HTML elements that we swap in and out, we toggle an `.is-loading` class on existing semantic containers and let CSS handle the visual transition.

### 1. The Container Skeleton (`.is-loading`)

```css
.is-loading {
  pointer-events: none !important;
  animation: ghostPulse 1.5s infinite ease-in-out;
}
```
* **`pointer-events: none !important;`**: This prevents users from clicking on anything inside the container while it's loading. Without this, a user could theoretically trigger multiple API calls or click a broken link while the DOM is updating.
* **`animation: ghostPulse`**: Applies a subtle opacity fade. To keep things performant, we only animate `opacity` and `transform`, letting the GPU handle it smoothly.

### 2. Hiding Existing Content

```css
.is-loading > *:not(.loading-state) {
  visibility: hidden !important;
  opacity: 0 !important;
}
```
* **Why `visibility: hidden` instead of `display: none`?** 
  * If we used `display: none`, the child elements would be removed from the document flow, causing the container to collapse to a height of 0px unless hardcoded otherwise.
  * By using `visibility: hidden`, the browser still computes the size of the text/images inside but simply paints them invisible. This perfectly maintains the dimension of the skeleton boxes (like your `Feels Like` grids or `forecast` cards) without needing to hardcode exact widths and heights!

### 3. The 3-Dot Loader UI (`.loading-state`)

```css
.loading-state {
  display: none;
  position: absolute;
  inset: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.overview.is-loading .loading-state {
  display: flex !important;
  visibility: visible !important;
}
```
* This block sits inside the main `.overview` container. It uses `position: absolute; inset: 0;` to stretch over the entire parent perfectly.
* It is hidden (`display: none`) by default until the parent acquires `.is-loading`. Because it's absolutely positioned, it acts as an overlay without disrupting the grid layout beneath it.

### 4. Pseudo-element Text Substitutes

```css
.ms-info.is-loading::after {
  content: "-";
  visibility: visible;
  display: block;
  font-size: 20px;
  color: var(--color-neutral-0);
}
```
* For the small widgets underneath the main card, creating a massive spinner is overkill. By utilizing the `::after` pseudo-element, we inject a visual placeholder (the `-` dash) dynamically through CSS.
* Even though the wrapper hides all its direct children (`visibility: hidden`), pseudo-elements can be made explicitly `visible` again, allowing us to show a placeholder without touching the HTML dynamically via JS.

---

## Part 2: JavaScript Logic Breakdown

The JavaScript logic orchestrates exactly *when* these CSS rules apply. 

### `showLoading()`

This function locates all the primary cards in the UI and transitions them to their skeleton frame before network data is requested.

```javascript
function showLoading() {
    // 1. Array initialization
    const cards = [
        document.querySelector('.overview'), 
        ...document.querySelectorAll('.ms-info'), 
        ...ui.forecastDays,                       
        ...ui.hourlyItems                         
    ];

    // 2. Class injection
    cards.forEach(card => {
        if(card) card.classList.add('is-loading');
    });
}
```
**Line-by-Line Breakdown:**
* `const cards = [...]`: We define an array of elements. We use the spread operator (`...`) to take NodeLists (from `querySelectorAll` or UI configuration) and expand them into a single, flat array.
* `document.querySelector('.overview')`: Grabs the main large element. (Notice we correctly target `.overview` and not `.overview-card`!).
* `cards.forEach(card => ...)`: We iterate over every single HTML element caught in the array.
* `if(card)`: A crucial safety check. In production, if the DOM changes or an element fails to render, attempting to add a class to `null` will throw an error and crash your script.
* `card.classList.add('is-loading')`: Appends the exact CSS class we discussed above, activating the overlay, hiding children, and triggering the pulse animation all at once.

### `hideLoading()`

Naturally, after the API returns data and we are done injecting the text strings, we must peel away the loading effect.

```javascript
function hideLoading() {
    // 1. Selector mapping
    const loadingCards = document.querySelectorAll('.is-loading');
    
    // 2. Class removal
    loadingCards.forEach(card => card.classList.remove('is-loading'));
}
```
**Line-by-Line Breakdown:**
* `const loadingCards = document.querySelectorAll('.is-loading');`: We don't manually map the `ui` object again! Instead, we just globally search for any element currently bearing the `.is-loading` class. This makes the function highly re-usable for any part of your UI.
* `card.classList.remove('is-loading');`: Strips the class off, immediately returning visibility to the child elements that had been hidden and restoring standard pointer operations.

### Integration in the Data Flow: `fetchCityWeather()`

```javascript
async function fetchCityWeather(cityName){
    const coords = await getCoards(cityName)

    if(!coords) return; 
    
    try{
        showLoading(); // <--- Trigger UI lock
        await getWeatherData(coords.lat, coords.lon, cityName, coords.country)
        hideLoading(); // <--- Release UI lock on Success
    }catch(error){
        console.error("Oops couldn't fetch city weather")
        hideLoading(); // <--- Release UI lock on Fail
    }
}
```
**Line-by-Line Breakdown:**
* `try...catch`: Because HTTP requests (`fetch`) are asynchronous and fail predictably (e.g. bad internet), we wrap the execution block.
* `showLoading()`: Executed immediately before the `getWeatherData` promise begins.
* `await getWeatherData(...)`: The code pauses execution on this line until the API fully returns its payload, parses the JSON, and updates the innerHTML variables for temperature/date. 
* `hideLoading()`: Once the injected text is safely loaded into the DOM, we sweep away the skeleton cover.
* `finally / catch hideLoading()`: Even if the API call throws an `error`, we immediately run `hideLoading()` inside the `catch` block so the user doesn't end up stuck staring at a frozen spinner forever.
