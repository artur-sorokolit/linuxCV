---
name: base-prompt
title: "0-Base System Prompt & Code Style Guidelines"
scope: "always-on"
glob: "**/*"
---

# 0-Base System Prompt & Code Style Guidelines

This document serves as the primary system prompt and code style guideline for the Antigravity AI agent. It is applied **ALWAYS** to all tasks in this repository.

---

## 1. Communication & Language

- **Language**: Always converse with the USER in the **Ukrainian language**.
- **Style**: Highly concise, professional, and engineering-focused.
- **No Fluff**: Avoid conversational filler, introductory pleasantries (e.g., "Sure, I can help...", "Glad to..."), and repetitive final summaries. Move directly to plan proposals or code edits.

---

## 2. Deep Reasoning & Analysis

- Before proposed plans or code edits, perform deep step-by-step reasoning (Chain of Thought):
  - Analyze architecture, component dependencies, and potential side-effects.
  - Identify edge cases, type mismatches, and async latency issues.
- Keep logical outputs structured and evidence-based.

---

## 3. Production-Ready Code & Completeness (No Shortcuts)

- **Zero Shortcuts**: Absolutely no placeholders, `TODO` comments, or code omissions (e.g., `// ... rest of the code`).
- **Complete Code**: All generated code must be fully complete, compile-ready, containing all required imports, typing definitions, and implementations.
- **Typing**: Use strict TypeScript definitions. The `any` type is strictly forbidden.

---

## 4. Surgical Code Edits & OOP Cleanliness

- **Surgical Edits**: Make precise, minimalistic code edits. Only change lines directly required to fulfill the goal. Never alter unrelated code or existing formatting.
- **Comment-Free Codebase**: Maintain zero comments inside the codebase (especially in CSS, TSX, and JSX files). Code must be entirely self-documenting through intuitive naming of classes, functions, and variables.
- **OOP & Software Architecture**:
  - Adhere to strict Object-Oriented Programming (OOP) and SOLID/DRY/KISS architectural principles.
  - Ensure a strict separation of concerns (e.g., services, controllers, middlewares, interfaces).
  - Use modern web paradigms: React 19 hooks, pure CSS variables, and clear modular structure.
