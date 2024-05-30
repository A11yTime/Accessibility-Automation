const { Builder, By } = require('selenium-webdriver');

(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  let passedTests = 0;
  let failedTests = 0;
  let failedElements = [];

  try {
    await driver.get('http://127.0.0.1:5501/index.html'); // Replace 'http://example.com' with the URL of the webpage you want to test

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
})();
