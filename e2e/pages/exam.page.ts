import { Page, expect } from '@playwright/test';

export class ExamPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/exam');
  }

  async selectTopic(topicName: string) {
    await this.page.selectOption('select:below(:text("Topic"))', { label: topicName });
  }

  async selectQuestionType(type: 'MCQ' | 'SHORT_ANSWER' | 'THEORY' | 'MIXED') {
    await this.page.selectOption('select:below(:text("Question type"))', { label: type });
  }

  async setQuestionCount(count: number) {
    await this.page.selectOption('select:below(:text("Questions"))', { value: String(count) });
  }

  async setTimerMinutes(minutes: number) {
    await this.page.fill('input[aria-label*="timer"]', String(minutes));
  }

  async startExam() {
    await this.page.click('button:has-text("Start exam")');
    // Wait for questions to load
    await expect(this.page.locator('text=/Question \\d+/')).toBeVisible({ timeout: 15000 });
  }

  async answerMCQ(questionIndex: number, optionText: string) {
    const question = this.page.locator(`text=/Question ${questionIndex}/`).locator('..').locator('..');
    await question.locator(`text="${optionText}"`).click();
  }

  async answerShortAnswer(questionIndex: number, answer: string) {
    const textareas = this.page.locator('textarea[aria-label*="short answer"]');
    await textareas.nth(questionIndex - 1).fill(answer);
  }

  async submitExam() {
    await this.page.click('button:has-text("Submit exam")');
  }

  async waitForResults() {
    await this.page.waitForURL('**/results');
    await expect(this.page.locator('text=/Your score/i')).toBeVisible();
  }

  async getScore(): Promise<{ score: number; total: number }> {
    const scoreText = await this.page.locator('text=/\\d+\\/\\d+/').first().textContent();
    const match = scoreText?.match(/(\d+)\/(\d+)/);
    if (!match) throw new Error('Could not parse score');
    return {
      score: parseInt(match[1]),
      total: parseInt(match[2]),
    };
  }
}
