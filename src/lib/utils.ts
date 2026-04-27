import crypto from "node:crypto";
import slugify from "slugify";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function toSlug(value: string) {
  return slugify(value, { lower: true, strict: true });
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function sampleArray<T>(items: T[], count: number) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy.slice(0, count);
}

export function formatQuestionType(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
