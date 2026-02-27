# Contributing to DeepMiner

Thank you for your interest in contributing to DeepMiner! We welcome contributions from the community to help make this product better.

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

If you find a bug, please create a GitHub Issue with the following information:
- A clear, descriptive title.
- Steps to reproduce the bug.
- Expected behavior vs. actual behavior.
- Screenshots or recordings if applicable.
- Your environment (browser, OS, etc.).

### Suggesting Enhancements

If you have an idea for a new feature or improvement, please create a GitHub Issue with:
- A clear, descriptive title.
- A detailed description of the proposed enhancement.
- Why this enhancement would be useful.

### Pull Requests

1.  **Fork the repository** and clone it locally.
2.  **Create a new branch** for your feature or bug fix:
    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b fix/your-bug-fix
    ```
3.  **Make your changes**. Ensure your code follows the project's coding standards.
4.  **Run tests** to ensure your changes don't break existing functionality:
    ```bash
    pnpm test
    ```
5.  **Commit your changes** using [Conventional Commits](https://www.conventionalcommits.org/):
    ```bash
    git commit -m "feat: add new feature"
    git commit -m "fix: resolve issue with sidebar"
    ```
6.  **Push your branch** to your fork:
    ```bash
    git push origin feature/your-feature-name
    ```
7.  **Open a Pull Request** against the `main` branch of the original repository. Provide a clear description of your changes and reference any related issues.

## Development Setup

1.  Install dependencies:
    ```bash
    pnpm install
    ```
2.  Start the development server:
    ```bash
    pnpm dev
    ```
3.  Run Storybook for component development:
    ```bash
    pnpm storybook
    ```

## Style Guide

- **TypeScript**: Use strict typing where possible.
- **React**: Use functional components and Hooks.
- **CSS**: Use Tailwind CSS utility classes and CSS Modules for component-specific styles.
- **Formatting**: The project uses Prettier and ESLint. Run `pnpm lint` to check for issues.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
