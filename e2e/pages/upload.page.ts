import { Page, expect } from '@playwright/test';

export class UploadPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/upload');
  }

  async authenticate(adminKey: string) {
    await this.page.goto('/');
    await this.page.evaluate((key) => {
      sessionStorage.setItem('academiq:admin-key', key);
    }, adminKey);
  }

  async gotoDashboard() {
    await this.page.goto('/upload/dashboard');
    await expect(this.page.getByRole('link', { name: /upload material/i })).toBeVisible({ timeout: 30000 });
  }

  async unlockDashboard(adminKey: string) {
    await this.page.getByLabel('Admin upload key').fill(adminKey);
    await this.page.getByRole('button', { name: /unlock dashboard/i }).click();
    await expect(this.page).toHaveURL(/.*\/upload\/dashboard/, { timeout: 30000 });
    await expect(this.page.getByRole('link', { name: /upload material/i })).toBeVisible({ timeout: 30000 });
  }

  async gotoUploadForm() {
    await this.page.goto('/upload/dashboard/upload');
    await expect(this.page.getByRole('heading', { name: /upload new material/i })).toBeVisible();
  }

  async gotoMaterialsManager() {
    await this.page.goto('/upload/dashboard/materials');
    await expect(this.page.getByRole('heading', { name: /manage materials/i })).toBeVisible();
  }

  async fillMaterialForm(data: {
    department?: string;
    course: string;
    courseCode?: string;
    topic: string;
    subtopic?: string;
  }) {
    await this.page.getByLabel(/^Department/i).selectOption(data.department || 'Human Anatomy');
    await this.page.getByRole('textbox', { name: /^Course Code/i }).fill(data.courseCode || 'ANA101');
    await this.page.getByRole('textbox', { name: /^Course Name/i }).fill(data.course);
    await this.page.getByRole('textbox', { name: /^Topic/i }).fill(data.topic);
    if (data.subtopic) {
      await this.page.getByLabel(/Subtopic/i).fill(data.subtopic);
    }
  }

  async uploadFile(filePath: string) {
    await this.page.setInputFiles('input[type="file"]', filePath);
  }

  async submitUpload() {
    await this.page.getByRole('button', { name: /upload and process/i }).click();
  }

  async waitForProcessingComplete() {
    await expect(
      this.page.getByText(/uploaded and processed successfully/i)
    ).toBeVisible({ timeout: 60000 });
  }

  async verifyDashboardStats() {
    await expect(this.page.getByText(/total materials/i)).toBeVisible({ timeout: 30000 });
    await expect(this.page.getByText(/knowledge chunks/i)).toBeVisible({ timeout: 30000 });
    await expect(this.page.getByText(/question bank/i)).toBeVisible({ timeout: 30000 });
  }
}
