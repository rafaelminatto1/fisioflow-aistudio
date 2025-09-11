// tests/e2e/patients.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to patients
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@fisioflow.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.click('text=Pacientes');
    await expect(page).toHaveURL('/pacientes');
  });

  test('should display patients list', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Pacientes');
    
    // Check patients table/grid
    await expect(page.locator('[data-testid="patients-list"]')).toBeVisible();
    
    // Check if patients are loaded
    const patientCards = page.locator('[data-testid="patient-card"]');
    await expect(patientCards.first()).toBeVisible();
  });

  test('should search patients', async ({ page }) => {
    // Use search input
    await page.fill('[data-testid="search-input"]', 'Maria');
    
    // Check filtered results
    await expect(page.locator('[data-testid="patient-card"]')).toContainText('Maria');
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    
    // Check all patients are shown again
    const patientCards = page.locator('[data-testid="patient-card"]');
    await expect(patientCards).toHaveCountGreaterThan(1);
  });

  test('should filter patients by status', async ({ page }) => {
    // Open status filter
    await page.click('[data-testid="status-filter"]');
    
    // Select Active status
    await page.click('text=Ativo');
    
    // Check filtered results
    const activePatients = page.locator('[data-testid="patient-card"]');
    await expect(activePatients.first()).toBeVisible();
    
    // Check status badge
    await expect(page.locator('[data-testid="status-badge"]').first()).toContainText('Ativo');
  });

  test('should open new patient modal', async ({ page }) => {
    // Click new patient button
    await page.click('[data-testid="new-patient-button"]');
    
    // Check modal opens
    await expect(page.locator('[data-testid="patient-modal"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Novo Paciente');
    
    // Check form fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="cpf"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });

  test('should create new patient', async ({ page }) => {
    // Open new patient modal
    await page.click('[data-testid="new-patient-button"]');
    
    // Fill form
    await page.fill('input[name="name"]', 'João da Silva');
    await page.fill('input[name="cpf"]', '123.456.789-00');
    await page.fill('input[name="email"]', 'joao@email.com');
    await page.fill('input[name="phone"]', '(11) 99999-9999');
    await page.fill('input[name="birthDate"]', '1990-01-15');
    
    // Submit form
    await page.click('[data-testid="save-patient-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Paciente criado com sucesso');
    
    // Check patient appears in list
    await expect(page.locator('[data-testid="patient-card"]')).toContainText('João da Silva');
  });

  test('should edit patient', async ({ page }) => {
    // Click edit button on first patient
    await page.click('[data-testid="patient-card"]').first();
    await page.click('[data-testid="edit-patient-button"]');
    
    // Check modal opens with data
    await expect(page.locator('[data-testid="patient-modal"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Editar Paciente');
    
    // Update name
    await page.fill('input[name="name"]', 'Maria Silva Santos');
    
    // Save changes
    await page.click('[data-testid="save-patient-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Paciente atualizado');
  });

  test('should view patient details', async ({ page }) => {
    // Click on patient card
    await page.click('[data-testid="patient-card"]').first();
    
    // Check patient detail modal/page
    await expect(page.locator('[data-testid="patient-detail"]')).toBeVisible();
    
    // Check patient information sections
    await expect(page.locator('[data-testid="patient-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="patient-history"]')).toBeVisible();
    await expect(page.locator('[data-testid="pain-map"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointments-history"]')).toBeVisible();
  });

  test('should delete patient', async ({ page }) => {
    // Click delete button
    await page.click('[data-testid="patient-card"]').first();
    await page.click('[data-testid="delete-patient-button"]');
    
    // Confirm deletion
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Paciente excluído');
  });

  test('should interact with pain map', async ({ page }) => {
    // Open patient details
    await page.click('[data-testid="patient-card"]').first();
    
    // Check pain map is visible
    await expect(page.locator('[data-testid="pain-map"]')).toBeVisible();
    
    // Click on body area to add pain point
    await page.click('[data-testid="body-front"]', { position: { x: 100, y: 150 } });
    
    // Check pain intensity modal
    await expect(page.locator('[data-testid="pain-intensity-modal"]')).toBeVisible();
    
    // Select pain intensity
    await page.click('[data-testid="pain-level-7"]');
    
    // Save pain point
    await page.click('[data-testid="save-pain-point"]');
    
    // Check pain point appears on map
    await expect(page.locator('[data-testid="pain-point"]')).toBeVisible();
  });

  test('should export patients data', async ({ page }) => {
    // Click export button
    await page.click('[data-testid="export-button"]');
    
    // Select export format
    await page.click('text=Excel');
    
    // Check download starts
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export"]');
    const download = await downloadPromise;
    
    // Check filename
    expect(download.suggestedFilename()).toContain('pacientes');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });
});