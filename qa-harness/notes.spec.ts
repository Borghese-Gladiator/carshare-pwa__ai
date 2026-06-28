import { test, expect } from '@playwright/test'

// Configure tests to run serially (they modify shared database state)
test.describe.configure({ mode: 'serial' })

// Test data constants
const CORRECT_CODE = process.env.ACCESS_CODE || 'test-code-123'
const ALICE_ID = '00000000-0000-0000-0000-000000000002'
const BOB_ID = '00000000-0000-0000-0000-000000000003'

// Shared authenticated state
let authenticatedCookies: any[] = []

test.describe('Notes & Issues Feature', () => {
  test.beforeAll(async ({ browser }) => {
    // Login once and store cookies for all tests
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      await page.goto('/login', { waitUntil: 'networkidle' })

      // Wait for password input with longer timeout
      const codeInput = await page.locator('input[type="password"]').first()
      await codeInput.fill(CORRECT_CODE, { timeout: 10000 })

      // Click submit
      const submitButton = await page.locator('button[type="submit"]').first()
      await submitButton.click()
      await page.waitForLoadState('networkidle')

      // Verify redirect to dashboard
      expect(page.url()).toContain('/dashboard')

      // Store cookies
      authenticatedCookies = await context.cookies()
    } finally {
      await page.close()
      await context.close()
    }
  })

  test('S1: Load /notes with pre-seeded active notes (FYI and URGENT). Verify badges, author names/initials, timestamps. Verify resolved notes excluded.', async ({
    page,
    context,
  }) => {
    // Add auth cookies
    await context.addCookies(authenticatedCookies)

    // Seed initial notes via API
    // Create a FYI note
    const fyi_res = await page.request.post('/api/notes', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: ALICE_ID,
        body: 'Check the tire pressure - seems a bit low',
        urgency: 'fyi',
      },
    })
    expect(fyi_res.ok()).toBe(true)

    // Create an URGENT note
    const urgent_res = await page.request.post('/api/notes', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: BOB_ID,
        body: 'Warning light came on - do not drive',
        urgency: 'urgent',
      },
    })
    expect(urgent_res.ok()).toBe(true)

    // Create a note and then resolve it (should not appear in list)
    const resolved_res = await page.request.post('/api/notes', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: ALICE_ID,
        body: 'Tank is full - all set for today',
        urgency: 'fyi',
      },
    })
    expect(resolved_res.ok()).toBe(true)
    const resolved_note = await resolved_res.json()
    const resolve_patch = await page.request.patch(`/api/notes/${resolved_note.id}`)
    expect(resolve_patch.ok()).toBe(true)

    // Navigate to notes page
    await page.goto('/notes')
    await page.waitForLoadState('networkidle')

    // Verify page header
    await expect(page.locator('text=Notes & Issues')).toBeVisible()

    // Verify FYI note is rendered with correct badge
    const fyi_badge = page.locator('span:has-text("FYI")').first()
    await expect(fyi_badge).toBeVisible()

    // Verify FYI note body is shown
    await expect(
      page.locator('text=Check the tire pressure - seems a bit low'),
    ).toBeVisible()

    // Verify FYI note author (Alice) is shown
    await expect(page.locator('text=Alice')).toBeVisible()

    // Verify timestamp is shown
    await expect(page.locator('text=ago')).toBeVisible()

    // Verify URGENT note is rendered with correct badge
    const urgent_badge = page.locator('span:has-text("URGENT")').first()
    await expect(urgent_badge).toBeVisible()

    // Verify URGENT note body is shown
    await expect(
      page.locator('text=Warning light came on - do not drive'),
    ).toBeVisible()

    // Verify URGENT note author (Bob) is shown
    await expect(page.locator('text=Bob')).toBeVisible()

    // Verify resolved note is NOT in the list
    await expect(
      page.locator('text=Tank is full - all set for today'),
    ).not.toBeVisible()
  })

  test('S2: Load /notes with no active notes. Verify empty state ("No more notes to show") renders.', async ({
    page,
    context,
  }) => {
    await context.addCookies(authenticatedCookies)

    // Resolve all active notes to ensure empty state
    const notes_res = await page.request.get('/api/notes')
    expect(notes_res.ok()).toBe(true)
    const { notes } = await notes_res.json()

    for (const note of notes) {
      const resolve_res = await page.request.patch(`/api/notes/${note.id}`)
      expect([200, 404]).toContain(resolve_res.status())
    }

    // Navigate to notes page
    await page.goto('/notes')
    await page.waitForLoadState('networkidle')

    // Verify empty state is displayed
    await expect(page.locator('text=No more notes to show')).toBeVisible()
    await expect(
      page.locator('text=Stay safe and share updates!'),
    ).toBeVisible()
  })

  test('S3: Create a FYI note (body "Test FYI Note", no location). Verify it appears with FYI badge.', async ({
    page,
    context,
  }) => {
    await context.addCookies(authenticatedCookies)

    // Set user ID for the form
    await page.evaluate(
      (userId) => localStorage.setItem('carshare_user_id', userId),
      ALICE_ID,
    )

    // Navigate to notes page
    await page.goto('/notes')
    await page.waitForLoadState('networkidle')

    // Click "Add Note" button
    const add_button = page.getByRole('button', { name: /Add Note/ })
    await expect(add_button).toBeVisible()
    await add_button.click()
    await page.waitForLoadState('domcontentloaded')

    // Verify modal opens
    await expect(page.locator('text=Add Note').first()).toBeVisible()

    // Select FYI urgency
    const fyi_button = page.locator('button:has-text("FYI")').first()
    await expect(fyi_button).toBeVisible()
    await fyi_button.click()

    // Fill in note body
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.fill('Test FYI Note')

    // Submit form
    const save_button = page.locator('button:has-text("Save Note")')
    await expect(save_button).toBeEnabled()
    await save_button.click()
    await page.waitForLoadState('networkidle')

    // Verify modal closes
    await expect(page.locator('text=Add Note').first()).not.toBeVisible()

    // Verify new note appears in list with FYI badge
    await expect(page.locator('text=Test FYI Note')).toBeVisible()
    const fyi_badge = page.locator('span:has-text("FYI")').first()
    await expect(fyi_badge).toBeVisible()

    // Verify author (Alice) is shown
    await expect(page.locator('text=Alice')).toBeVisible()
  })

  test('S4: Create URGENT note with location. Verify URGENT badge, location card variant, location text shown.', async ({
    page,
    context,
  }) => {
    await context.addCookies(authenticatedCookies)

    // Set user ID for the form
    await page.evaluate(
      (userId) => localStorage.setItem('carshare_user_id', userId),
      BOB_ID,
    )

    // Navigate to notes page
    await page.goto('/notes')
    await page.waitForLoadState('networkidle')

    // Click "Add Note" button
    const add_button = page.getByRole('button', { name: /Add Note/ })
    await expect(add_button).toBeVisible()
    await add_button.click()
    await page.waitForLoadState('domcontentloaded')

    // Select URGENT urgency
    const urgent_button = page.locator('button:has-text("URGENT")').first()
    await expect(urgent_button).toBeVisible()
    await urgent_button.click()

    // Fill in note body
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.fill('Critical issue')

    // Fill in location
    const location_input = page.locator('input[placeholder*="Parked near"]')
    await expect(location_input).toBeVisible()
    await location_input.fill('By the door')

    // Submit form
    const save_button = page.locator('button:has-text("Save Note")')
    await expect(save_button).toBeEnabled()
    await save_button.click()
    await page.waitForLoadState('networkidle')

    // Verify modal closes
    await expect(page.locator('text=Add Note').first()).not.toBeVisible()

    // Verify new note appears in list
    await expect(page.locator('text=Critical issue')).toBeVisible()

    // Verify URGENT badge is visible
    const urgent_badge = page.locator('span:has-text("URGENT")').first()
    await expect(urgent_badge).toBeVisible()

    // Verify location card variant (has "Location" label)
    const location_badge = page.locator('span:has-text("Location")').first()
    await expect(location_badge).toBeVisible()

    // Verify location text is shown
    await expect(page.locator('text=By the door')).toBeVisible()

    // Verify author (Bob) is shown
    await expect(page.locator('text=Bob')).toBeVisible()
  })

  test('S5: Click Resolve on a note. Verify it disappears from list on subsequent fetch.', async ({
    page,
    context,
  }) => {
    await context.addCookies(authenticatedCookies)

    // Set user ID
    await page.evaluate(
      (userId) => localStorage.setItem('carshare_user_id', userId),
      ALICE_ID,
    )

    // Create a test note via API
    const note_res = await page.request.post('/api/notes', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: ALICE_ID,
        body: 'Test note to resolve',
        urgency: 'fyi',
      },
    })
    expect(note_res.ok()).toBe(true)
    const test_note = await note_res.json()

    // Navigate to notes page
    await page.goto('/notes')
    await page.waitForLoadState('networkidle')

    // Verify note is visible
    await expect(page.locator('text=Test note to resolve')).toBeVisible()

    // Click Resolve button for this note
    const resolve_button = page.getByRole('button', { name: /Resolve/ }).first()
    await expect(resolve_button).toBeVisible()
    await resolve_button.click()

    // Wait for the resolve API call and list refresh
    await page.waitForLoadState('networkidle')

    // Verify note is no longer visible in the list
    await expect(page.locator('text=Test note to resolve')).not.toBeVisible()

    // Verify via API that the note is marked as resolved
    const verify_res = await page.request.get('/api/notes')
    expect(verify_res.ok()).toBe(true)
    const { notes } = await verify_res.json()
    const resolved_note = notes.find((n: any) => n.id === test_note.id)
    expect(resolved_note).toBeUndefined()
  })

  test('S6: Search by typing note body text. Verify filtered results. Clear search. Verify all notes shown again.', async ({
    page,
    context,
  }) => {
    await context.addCookies(authenticatedCookies)

    // Set user ID
    await page.evaluate(
      (userId) => localStorage.setItem('carshare_user_id', userId),
      ALICE_ID,
    )

    // Create test notes with distinct bodies
    const note1_res = await page.request.post('/api/notes', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: ALICE_ID,
        body: 'Search for brakes issue',
        urgency: 'fyi',
      },
    })
    expect(note1_res.ok()).toBe(true)

    const note2_res = await page.request.post('/api/notes', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        userId: BOB_ID,
        body: 'Engine temperature warning',
        urgency: 'urgent',
      },
    })
    expect(note2_res.ok()).toBe(true)

    // Navigate to notes page
    await page.goto('/notes')
    await page.waitForLoadState('networkidle')

    // Verify both notes are visible
    await expect(page.locator('text=Search for brakes issue')).toBeVisible()
    await expect(
      page.locator('text=Engine temperature warning'),
    ).toBeVisible()

    // Click search button to toggle search box
    const search_button = page.getByRole('button', { name: /Search/ })
    await expect(search_button).toBeVisible()
    await search_button.click()
    await page.waitForLoadState('domcontentloaded')

    // Verify search input is visible
    const search_input = page.locator('input[placeholder*="Search"]')
    await expect(search_input).toBeVisible()

    // Search for "brakes"
    await search_input.fill('brakes')
    await page.waitForTimeout(300)

    // Verify only the "brakes" note is shown
    await expect(page.locator('text=Search for brakes issue')).toBeVisible()
    await expect(
      page.locator('text=Engine temperature warning'),
    ).not.toBeVisible()

    // Clear search
    await search_input.clear()
    await page.waitForTimeout(300)

    // Verify both notes are visible again
    await expect(page.locator('text=Search for brakes issue')).toBeVisible()
    await expect(
      page.locator('text=Engine temperature warning'),
    ).toBeVisible()
  })
})
