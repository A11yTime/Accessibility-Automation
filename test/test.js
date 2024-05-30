const { Builder, By } = require('selenium-webdriver');

async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  let passedTests = 0;
  let failedTests = 0;
  let failedElements = [];

  try {
    await driver.get('http://example.com'); // Replace 'http://example.com' with the URL of the webpage you want to test

    // Function to calculate contrast ratio
    const getContrastRatio = (color1, color2) => {
      const luminance1 = getLuminance(color1);
      const luminance2 = getLuminance(color2);
      const contrast = (Math.max(luminance1, luminance2) + 0.05) / (Math.min(luminance1, luminance2) + 0.05);
      return contrast.toFixed(2);
    };

    // Function to calculate luminance
    const getLuminance = (color) => {
      const rgba = color.match(/\d+/g).map(Number);
      const [r, g, b] = rgba.slice(0, 3).map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    // Get all focusable elements
    const focusableElementsMouse = await driver.findElements(By.css('button, [href], input[type="button"], input[type="submit"], input[type="image"], select, textarea'));
    const focusableElementsKeyboard = await driver.findElements(By.css('button, [href], input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="image"]), select, textarea, [tabindex]:not([tabindex="-1"])'));

    // Check for elements available with mouse and keyboard
    const elementsWithMouseAndKeyboard = focusableElementsMouse.filter(element => focusableElementsKeyboard.includes(element));
    if (elementsWithMouseAndKeyboard.length > 0) {
      console.error('\x1b[31mError: The following elements are available with both mouse click and Tab/Enter key:\x1b[0m');
      for (const element of elementsWithMouseAndKeyboard) {
        const tagName = await element.getTagName();
        const outerHTML = await element.getAttribute('outerHTML');
        console.error('\x1b[31m', tagName, outerHTML, '\x1b[0m');
        failedElements.push({ tagName, outerHTML });
      }
      failedTests++;
    } else {
      passedTests++;
    }

    // Check for missing label text, aria-label, aria-labelledby
    const inputElements = await driver.findElements(By.css('input, select, textarea'));
    for (const element of inputElements) {
      const tagName = await element.getTagName();
      const label = await element.getAttribute('aria-label');
      const labelledBy = await element.getAttribute('aria-labelledby');
      const labelText = await driver.executeScript("return arguments[0].labels[0].textContent", element).catch(() => null);

      if (!label && !labelledBy && !labelText) {
        console.error('\x1b[31mError: Input element is missing label text, aria-label, or aria-labelledby:\x1b[0m');
        console.error('\x1b[31m', tagName, await element.getAttribute('outerHTML'), '\x1b[0m');
        failedTests++;
        failedElements.push({ tagName, outerHTML: await element.getAttribute('outerHTML') });
      } else {
        passedTests++;
      }
    }

    // Check for missing alternative text for images
    const imageElements = await driver.findElements(By.css('img:not([alt])'));
    if (imageElements.length > 0) {
      console.error('\x1b[31mError: The following images are missing alternative text:\x1b[0m');
      for (const element of imageElements) {
        const tagName = await element.getTagName();
        const outerHTML = await element.getAttribute('outerHTML');
        console.error('\x1b[31m', tagName, outerHTML, '\x1b[0m');
        failedTests++;
        failedElements.push({ tagName, outerHTML });
      }
    } else {
      passedTests++;
    }

    // Check for missing text, aria-label, aria-labelledby, aria-describedby for links, buttons, and elements with tabindex="0"
    const clickableElements = await driver.findElements(By.css('a, button, [tabindex="0"]'));
    for (const element of clickableElements) {
      const tagName = await element.getTagName();
      const labelText = await element.getText();
      const label = await element.getAttribute('aria-label');
      const labelledBy = await element.getAttribute('aria-labelledby');
      const describedBy = await element.getAttribute('aria-describedby');

      if (!labelText && !label && !labelledBy && !describedBy) {
        console.error('\x1b[31mError: Element is missing text, aria-label, aria-labelledby, or aria-describedby:\x1b[0m');
        console.error('\x1b[31m', tagName, await element.getAttribute('outerHTML'), '\x1b[0m');
        failedTests++;
        failedElements.push({ tagName, outerHTML: await element.getAttribute('outerHTML') });
      } else {
        passedTests++;
      }
    }

    // Get all elements with text
    const textElements = await driver.findElements(By.xpath('//*[normalize-space() and not(self::script)]'));
    for (const element of textElements) {
      const computedStyle = await element.getCssValue('color');
      const bgColor = await element.getCssValue('background-color');
      const contrastRatio = getContrastRatio(computedStyle, bgColor);

      if (contrastRatio < 4.5) {
        console.error('\x1b[31mError: Element does not meet proper contrast ratio (minimum required: 4.5):\x1b[0m');
        console.error('\x1b[31m', await element.getTagName(), await element.getAttribute('outerHTML'), '\x1b[0m');
        failedTests++;
        failedElements.push({ tagName: await element.getTagName(), outerHTML: await element.getAttribute('outerHTML') });
      } else {
        passedTests++;
      }
    }

    // Output test results
    console.log(`\nTests Passed: ${passedTests}`);
    console.log(`Tests Failed: ${failedTests}`);

    // Output failed elements
    if (failedElements.length > 0) {
      console.log('\nFailed Elements:');
      failedElements.forEach((element, index) => {
        console.log(`${index + 1}. ${element.tagName} - ${element.outerHTML}`);
      });
    }
  } finally {
    await driver.quit();
  }
}

example();
