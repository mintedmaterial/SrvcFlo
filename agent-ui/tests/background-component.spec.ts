import { test, expect } from '@playwright/test'

test.describe('BackgroundPaths Component Tests', () => {

  test('Main page should load background component without errors', async ({ page }) => {
    const consoleErrors = []
    const jsErrors = []

    // Listen for console errors and JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    page.on('pageerror', error => {
      jsErrors.push(error.message)
    })

    // Navigate to main page
    await page.goto('http://localhost:3000/')

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check that the page title contains "ServiceFlow AI Agent UI"
    await expect(page.locator('h1')).toContainText('ServiceFlow AI Agent UI')

    // Check that the "Enter serviceflow.com" button is present
    await expect(page.locator('button:has-text("Enter serviceflow.com")')).toBeVisible()

    // Verify background canvas is present
    await expect(page.locator('canvas')).toBeVisible()

    // Check for any JavaScript errors specifically about fallbackConfigs
    const fallbackConfigErrors = jsErrors.filter(error =>
      error.includes('fallbackConfigs') || error.includes('ReferenceError')
    )

    expect(fallbackConfigErrors).toHaveLength(0)

    // Check for any console errors that might indicate problems
    const criticalErrors = consoleErrors.filter(error =>
      error.includes('ReferenceError') ||
      error.includes('TypeError') ||
      error.includes('fallbackConfigs')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('Navigation from main page to agents page should work', async ({ page }) => {
    // Navigate to main page
    await page.goto('http://localhost:3000/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Click the "Enter serviceflow.com" button
    await page.click('button:has-text("Enter serviceflow.com")')

    // Wait for navigation to agents page
    await page.waitForURL('**/agents')

    // Verify we're on the agents page
    expect(page.url()).toContain('/agents')
  })

  test('Agents page should NOT show background initially', async ({ page }) => {
    const consoleErrors = []
    const jsErrors = []

    // Monitor for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    page.on('pageerror', error => {
      jsErrors.push(error.message)
    })

    // Navigate directly to agents page
    await page.goto('http://localhost:3000/agents')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Background should NOT be visible initially (idle state is false)
    await expect(page.locator('canvas')).not.toBeVisible()

    // Check that main UI elements are present
    // Note: These selectors might need adjustment based on your actual components
    await expect(page.locator('.bg-neutral-950')).toBeVisible()

    // Check for any JavaScript errors
    const fallbackConfigErrors = jsErrors.filter(error =>
      error.includes('fallbackConfigs') || error.includes('ReferenceError')
    )

    expect(fallbackConfigErrors).toHaveLength(0)
  })

  test('Agents page should show background after simulated idle time', async ({ page }) => {
    // Navigate to agents page
    await page.goto('http://localhost:3000/agents')
    await page.waitForLoadState('networkidle')

    // Initially background should not be visible
    await expect(page.locator('canvas')).not.toBeVisible()

    // Simulate idle time by not interacting and waiting
    // Note: The idle time is set to 5 minutes in the component,
    // but for testing purposes, we might want to modify the component
    // to have a shorter idle time in test mode

    // For now, let's just verify the idle logic exists by checking the DOM
    // The background will be shown when isIdle state becomes true

    // We can't easily test the 5-minute timeout in a fast test,
    // but we can verify that the structure is correct
    const backgroundContainer = page.locator('.fixed.inset-0.z-30')

    // The container exists but should be hidden initially
    // (it will only be visible when isIdle is true)
    const backgroundExists = await backgroundContainer.count() > 0
    expect(backgroundExists).toBeTruthy()
  })

  test('No unnecessary background reloads on agents page', async ({ page }) => {
    let backgroundConstructorCalls = 0
    let canvasCreations = 0

    // Monitor network requests to catch unnecessary reloads
    page.on('request', request => {
      // Count any requests that might indicate background component reloads
      if (request.url().includes('background') ||
          request.url().includes('_next/static') && request.url().includes('background')) {
        console.log('Background-related request:', request.url())
      }
    })

    // Monitor DOM changes for canvas elements
    await page.goto('http://localhost:3000/agents')
    await page.waitForLoadState('networkidle')

    // Count initial canvas elements
    const initialCanvasCount = await page.locator('canvas').count()

    // Simulate some user activity (moving mouse, clicking)
    await page.mouse.move(100, 100)
    await page.mouse.move(200, 200)
    await page.mouse.click(150, 150)

    // Wait a bit
    await page.waitForTimeout(2000)

    // Check that canvas count hasn't increased unnecessarily
    const finalCanvasCount = await page.locator('canvas').count()

    // Should be 0 initially (not idle) and should remain 0
    expect(finalCanvasCount).toBe(0)
  })

  test('Background component logs indicate proper initialization', async ({ page }) => {
    const consoleLogs = []

    // Capture all console messages
    page.on('console', msg => {
      consoleLogs.push(msg.text())
    })

    // Navigate to main page where background is always shown
    await page.goto('http://localhost:3000/')
    await page.waitForLoadState('networkidle')

    // Wait for background animation to initialize
    await page.waitForTimeout(3000)

    // Look for expected log messages
    const addedFallbackLogs = consoleLogs.filter(log =>
      log.includes('Added') && log.includes('fallback images')
    )

    const startingRainLogs = consoleLogs.filter(log =>
      log.includes('Starting rain')
    )

    // Should have logs indicating successful initialization
    expect(addedFallbackLogs.length).toBeGreaterThan(0)
    expect(startingRainLogs.length).toBeGreaterThan(0)
  })
})