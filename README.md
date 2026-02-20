# OuiiSpeak CMS

A Next.js-based Content Management System for managing language learning content, including modules, lessons, groups, and slides.

## 🎯 Overview

The OuiiSpeak CMS is a comprehensive content management system built with Next.js 16, TypeScript, and Supabase. It provides a user-friendly interface for creating and managing language learning content with support for multiple slide types, dynamic form configurations, and real-time data synchronization.

### Key Features

- **Hierarchical Content Management**: Modules → Lessons → Groups → Slides
- **Dynamic Form System**: Configuration-driven slide editing with customizable fields
- **Multiple Slide Types**: Support for text, title, lesson-end, AI speak repeat, student repeat, and speech match slides
- **Type-Safe Architecture**: Full TypeScript coverage with comprehensive type definitions
- **Comprehensive Testing**: 398+ tests covering critical paths, components, and integration flows
- **Modern UI**: Clean, responsive interface built with Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ouiispeak-cms
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   For detailed environment variable setup, see [docs/SETUP_ENV_VARIABLES.md](./docs/SETUP_ENV_VARIABLES.md)

4. **Run database migrations** (if needed)

   Database migrations are located in `docs/migrations/`. Run them in order:
   ```bash
   # Example: Run migration via Supabase CLI or dashboard
   # See docs/migrations/001_create_slide_config_tables.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal)

## 📁 Project Structure

```
ouiispeak-cms/
├── app/                    # Next.js App Router pages
│   ├── edit-slide/        # Slide editing interface
│   ├── edit-lesson/        # Lesson management
│   ├── edit-group/         # Group management
│   ├── edit-module/        # Module management
│   ├── manage-slide-configs/ # Slide type configuration UI
│   └── ...
├── components/             # React components
│   ├── cms/               # CMS-specific components
│   ├── slide-editor/      # Slide editing components
│   ├── slide-config/       # Configuration management components
│   └── ui/                # Reusable UI components
├── lib/                    # Core library code
│   ├── constants/         # Constants (slide types, languages, etc.)
│   ├── data/              # Data access layer (Supabase queries)
│   ├── domain/            # Domain models
│   ├── hooks/             # Custom React hooks
│   │   ├── slides/        # Slide-related hooks
│   │   ├── lessons/       # Lesson-related hooks
│   │   └── cms/           # CMS-specific hooks
│   ├── mappers/           # Data mapping utilities
│   ├── schemas/           # Form field definitions and configs
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── docs/                   # Documentation
│   ├── migrations/        # Database migration scripts
│   └── ...                # Various documentation files
├── scripts/                # Utility scripts
└── public/                # Static assets
```

## 🏗️ Architecture

### Configuration-Driven Forms

The CMS uses a configuration-driven approach for slide editing:

1. **Field Registry** (`lib/schemas/slideFieldRegistry.ts`): Defines all available form fields
2. **Slide Type Configs** (`lib/data/slideTypeConfigs.ts`): Database-stored configurations for each slide type
3. **Dynamic Form Renderer** (`components/slide-editor/DynamicSlideForm.tsx`): Renders forms based on configurations

This allows non-technical users to customize form fields via the UI without code changes.

### State Management

The slide editing page uses a custom hook architecture:

- **`useSlideFormData`**: Loads slide and group data
- **`useSlideFormState`**: Manages form state and tracks unsaved changes
- **`useSlideFormValidation`**: Validates form data before saving
- **`useSlideFormSave`**: Handles saving slide data to the database

### Type Safety

The project maintains strict type safety:

- **Zero `any` types** in production code
- **Comprehensive type definitions** for all slide types (`lib/types/slideProps.ts`)
- **Type guards** for runtime type checking
- **Centralized constants** (`lib/constants/slideConstants.ts`)

## 🧪 Testing

The project uses Vitest for unit testing and React Testing Library for component testing.

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

- **398 tests** passing across 19 test files
- **Critical paths**: 100% coverage (validation, save, load)
- **Components**: All form section components tested
- **Integration**: Save/load flow integration tests

See [docs/TEST_COVERAGE_PROGRESS.md](./docs/TEST_COVERAGE_PROGRESS.md) for detailed coverage information.

## 📝 Development Workflow

### Adding a New Slide Type

1. **Define the type** in `lib/types/slideProps.ts`
2. **Add constants** in `lib/constants/slideConstants.ts`
3. **Create configuration** via the UI (`/manage-slide-configs`) or script
4. **Update field registry** if new fields are needed (`lib/schemas/slideFieldRegistry.ts`)
5. **Add tests** for the new type

### Making Changes to Forms

1. **Update field registry** if adding new fields
2. **Update slide type config** via UI or database
3. **Update type definitions** if changing data structure
4. **Add/update tests** for changed functionality

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js and TypeScript
- **Formatting**: Prettier (if configured)
- **Hooks**: Organized by feature domain
- **Components**: Co-located with related functionality

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Type checking
npm run type-check       # Run TypeScript type checker

# Database/Config
npm run create-config    # Create slide type configuration (see scripts/)
npm run verify-config    # Verify slide type configuration (see scripts/)
```

## 📚 Documentation

**Start here:** [docs/README.md](./docs/README.md) — Documentation index with links to all guides.

### Essential guides (developer onboarding)

- **[ARCHITECTURE_OVERVIEW.md](./docs/ARCHITECTURE_OVERVIEW.md)**: Engineering overview — data model, systems, LaDy ingestion, player integration
- **[SITEMAP.md](./docs/SITEMAP.md)**: Full route map — all pages and API routes
- **[SETUP_ENV_VARIABLES.md](./docs/SETUP_ENV_VARIABLES.md)**: Environment variable setup (required and optional)

### Other documentation

- **[REFACTOR_SLIDE_FORM_SYSTEM.md](./docs/REFACTOR_SLIDE_FORM_SYSTEM.md)**: Configuration-driven form system
- **[TEST_COVERAGE_PROGRESS.md](./docs/TEST_COVERAGE_PROGRESS.md)**: Test coverage status
- **[P8_IMPLEMENTATION_LOG.md](./docs/P8_IMPLEMENTATION_LOG.md)**: LaDy ingestion implementation log

## 🎨 Recent Improvements

### Type Safety (Completed)
- ✅ Eliminated all `any` types from production code
- ✅ Created comprehensive type definitions for all slide types
- ✅ Added type guards for runtime type checking
- ✅ Centralized constants for slide types, languages, and speech modes

### Code Organization (Completed)
- ✅ Refactored `edit-slide` page from 1,467 → 344 lines (77% reduction)
- ✅ Extracted custom hooks for data loading, state management, validation, and saving
- ✅ Created reusable form section components
- ✅ Organized hooks by feature domain (`slides/`, `lessons/`, `cms/`)

### Testing (Completed)
- ✅ Added 398+ comprehensive tests
- ✅ Achieved 95% coverage on critical paths
- ✅ Tested all form section components
- ✅ Added integration tests for save/load flow

### Code Quality (Completed)
- ✅ Replaced all `console.log` with centralized logger utility
- ✅ Created generic mapper utility to eliminate code duplication
- ✅ Removed dead code (archive folder)
- ✅ Consolidated audit documentation

## 🐛 Troubleshooting

### Common Issues

**Environment variables not loading**
- Ensure `.env.local` is in the root directory
- Restart the development server after adding variables
- Check that variable names start with `NEXT_PUBLIC_` for client-side access

**Database connection errors**
- Verify Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure database migrations have been run

**Type errors**
- Run `npm run type-check` to see all type errors
- Ensure all imports are correct
- Check that type definitions match your database schema

**Test failures**
- Ensure all dependencies are installed: `npm install`
- Check that environment variables are set for tests
- Review test output for specific error messages

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass
5. Update documentation as needed
6. Submit a pull request

## 📄 License

[Add your license information here]

## 🔗 Related Projects

- **OuiiSpeak Player**: The learner-facing application that consumes content from this CMS

## 📞 Support

For questions or issues, please [create an issue](link-to-issues) or contact the development team.

---

**Last Updated**: December 2024  
**Version**: 1.0.0
