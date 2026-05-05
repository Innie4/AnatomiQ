import { Page, expect } from '@playwright/test';

export class UploadPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/upload');
  }

  async unlockDashboard(adminKey: string) {
    await this.page.fill('input[type="password"]', adminKey);
    await this.page.click('button:has-text("Unlock dashboard")');
    // Wait for dashboard to load
    await expect(this.page.locator('text=Total materials')).toBeVisible();
  }

  async fillMaterialForm(data: {
    title: string;
    course: string;
    topic: string;
    subtopic?: string;
  }) {
    await this.page.fill('input[aria-label="Material title"]', data.title);
    await this.page.fill('input[aria-label="Course name"]', data.course);
    await this.page.fill('input[aria-label="Topic name"]', data.topic);
    if (data.subtopic) {
      await this.page.fill('input[aria-label*="Subtopic"]', data.subtopic);
    }
  }

  async uploadFile(filePath: string) {
    await this.page.setInputFiles('input[type="file"]', filePath);
  }

  async submitUpload() {
    await this.page.click('button:has-text("Upload and process")');
  }

  async waitForProcessingComplete() {
    // Wait for success message
    await expect(
      this.page.locator('text=/uploaded and processed successfully/i')
    ).toBeVisible({ timeout: 30000 });
  }

  async verifyDashboardStats() {
    await expect(this.page.locator('text=Total materials')).toBeVisible();
    await expect(this.page.locator('text=Knowledge chunks')).toBeVisible();
    await expect(this.page.locator('text=Question bank')).toBeVisible();
  }
}
