# Contributing to D-LOOP UI

Thank you for your interest in contributing to D-LOOP UI! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Be respectful and inclusive of all contributors
- Provide constructive feedback and maintain a positive environment
- Focus on what is best for the community and the project
- Show empathy towards other community members

## Getting Started

### Development Environment

1. **Fork the Repository**
   Start by forking the repository and cloning your fork locally.

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env` file based on `.env.example` with your development keys.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Branch for individual features
- `bugfix/bug-description` - Branch for bug fixes

Always create new branches from `develop` for features or bug fixes.

## Development Guidelines

### Coding Standards

1. **TypeScript Best Practices**
   - Use explicit types rather than `any`
   - Leverage interfaces and type aliases for complex types
   - Follow naming conventions: PascalCase for components, camelCase for functions and variables

2. **Component Structure**
   - Use functional components with hooks
   - Organize components in logical folders by feature or type
   - Keep components small and focused on a single responsibility

3. **State Management**
   - Use React Query for server state
   - Use React's built-in state management for UI state
   - Avoid prop drilling with context when necessary

4. **Styling**
   - Use Tailwind CSS for styling
   - Follow the established design system
   - Use utility classes over custom CSS when possible
   - Use the `cn` utility for conditional class names

### Testing

1. **Unit Tests**
   - Write tests for all hooks and utilities
   - Test components for correct rendering and user interactions
   - Run tests before submitting a PR: `npm test`

2. **Integration Tests**
   - Test that components work together as expected
   - Verify blockchain interactions work as expected with test networks

### Documentation

1. **Code Comments**
   - Document complex logic with clear comments
   - Use JSDoc for function and component documentation

2. **README and Documentation Files**
   - Update documentation when adding or changing features
   - Ensure examples in documentation work as described

## Pull Request Process

1. **Create a Pull Request**
   - Create PRs against the `develop` branch
   - Use the PR template and fill in all required information
   - Link to relevant issues with "Fixes #issue-number"

2. **PR Description**
   - Clearly describe what the PR does
   - Include screenshots or GIFs for UI changes
   - List any breaking changes
   - Document any new dependencies

3. **Code Review**
   - Address all review comments
   - Request reviews from relevant team members
   - Be responsive to feedback

4. **Continuous Integration**
   - Ensure all CI checks pass
   - Fix any issues that arise from automated testing

5. **Merge Requirements**
   - PR must be approved by at least one maintainer
   - All discussions must be resolved
   - All CI checks must pass

## Commit Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Formatting changes
- `refactor:` - Code changes that neither fix bugs nor add features
- `test:` - Adding or fixing tests
- `chore:` - Changes to build process or auxiliary tools

Examples:
```
feat: add wallet disconnect feature
fix: resolve state update issue on token delegation
docs: update architecture diagram
refactor: improve performance of leaderboard component
```

## Additional Resources

- [Project Architecture](/docs/architecture.md)
- [Design System Documentation](/docs/design-system.md)
- [Deployment Guide](/docs/deployment.md)

## Questions?

If you have any questions or need help, please:
- Open an issue with your question
- Reach out to the maintainers
- Join our community Discord for real-time discussion

Thank you for contributing to D-LOOP UI!