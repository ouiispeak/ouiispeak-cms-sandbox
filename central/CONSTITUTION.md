{
  "date": "2026-04-06",
  "repository": "ouiispeak-cms-sandbox",
  "config_authority": {
    "primary": "supabase",
    "authority_chain": [
      "public.field_dictionary",
      "public.universal_fields",
      "public.field_dictionary_component_rules",
      "public.component_config_fields"
    ],
    "projection_rules": [
      "public.universal_fields.name must exist in public.field_dictionary.field_key",
      "public.component_config_fields.(category_name,field_name) must exist in public.universal_fields.(category_name,name)"
    ],
    "canonical_write_functions": [
      "public.upsert_field_dictionary_entry",
      "public.set_field_dictionary_status",
      "public.set_field_dictionary_component_presence",
      "public.rename_universal_field",
      "public.set_universal_field_order"
    ],
    "mirror_docs": [
      "central/SOT/universal_configs.md",
      "central/SOT/module_configs.md",
      "central/SOT/lessons_configs.md",
      "central/SOT/groups_configs.md",
      "central/SOT/slides_configs.md"
    ]
  },
  "canonical_mapping_boundary": {
    "source_file": "lib/canonicalFieldMap.ts",
    "shared_component_core": "lib/componentCore.ts",
    "shared_hierarchy_engine": "lib/hierarchyComponentEngine.ts",
    "modules": {
      "identityFieldKey": "moduleId",
      "identityDbColumn": "id",
      "parentFieldKey": null,
      "parentDbColumn": null,
      "coreFieldDbColumns": {
        "title": "title",
        "text": "text",
        "level": "level_number"
      }
    },
    "lessons": {
      "identityFieldKey": "lessonId",
      "identityDbColumn": "id",
      "parentFieldKey": "moduleId",
      "parentDbColumn": "module_id",
      "coreFieldDbColumns": {
        "title": "title",
        "text": "text",
        "subtitle": "subtitle"
      }
    },
    "groups": {
      "identityFieldKey": "groupId",
      "identityDbColumn": "id",
      "parentFieldKey": "lessonId",
      "parentDbColumn": "lesson_id",
      "coreFieldDbColumns": {
        "title": "title",
        "text": "text",
        "subtitle": "subtitle"
      }
    },
    "slides": {
      "identityFieldKey": "slideId",
      "identityDbColumn": "id",
      "parentFieldKey": "groupId",
      "parentDbColumn": "group_id",
      "coreFieldDbColumns": {}
    }
  },
  "identity_contract": {
    "db_identity": {
      "modules.id": "uuid",
      "lessons.id": "uuid",
      "lessons.module_id": "uuid",
      "groups.id": "uuid",
      "groups.lesson_id": "uuid",
      "slides.id": "uuid",
      "slides.group_id": "uuid"
    },
    "json_identity_keys": {
      "modules_update": "moduleId",
      "lessons_create_parent": "moduleId",
      "lessons_update": "lessonId",
      "lessons_update_optional_parent": "moduleId",
      "groups_create_parent": "lessonId",
      "groups_update": "groupId",
      "groups_update_optional_parent": "lessonId",
      "slides_create_parent": "groupId",
      "slides_update": "slideId",
      "slides_update_optional_parent": "groupId"
    },
    "ui_route_params": [
      "[moduleId]",
      "[lessonId]",
      "[groupId]",
      "[slideId]"
    ],
    "route_param_rule": "Route param names remain stable and values are UUID."
  },
  "setup_sql_order": [
    "supabase/manual/001_levels_setup.sql",
    "supabase/manual/002_config_authority_setup.sql",
    "supabase/manual/004_field_dictionary_authority_setup.sql",
    "supabase/manual/009_uuid_identity_reset.sql"
  ],
  "module_authority": {
    "primary": "supabase",
    "tables": [
      "public.modules",
      "public.module_field_values"
    ],
    "core_columns": [
      "id",
      "title",
      "text",
      "level_number",
      "created_at"
    ],
    "dynamic_storage_key": [
      "module_id",
      "component_name",
      "category_name",
      "field_name"
    ],
    "required_rule_source": "public.field_dictionary_component_rules.is_required (component_name = 'modules')",
    "system_controlled_fields": [
      "moduleId"
    ],
    "system_field_guard": "public.module_field_values.field_name must never equal 'moduleId'",
    "atomic_import_rpc": [
      "public.import_modules_create_atomic",
      "public.import_modules_update_atomic"
    ],
    "json_contract": {
      "update_identity_key": "moduleId",
      "create_parent_key": null
    }
  },
  "lesson_authority": {
    "primary": "supabase",
    "tables": [
      "public.lessons",
      "public.lesson_field_values"
    ],
    "core_columns": [
      "id",
      "module_id",
      "title",
      "text",
      "subtitle",
      "created_at"
    ],
    "dynamic_storage_key": [
      "lesson_id",
      "component_name",
      "category_name",
      "field_name"
    ],
    "required_rule_source": "public.field_dictionary_component_rules.is_required (component_name = 'lessons')",
    "system_controlled_fields": [
      "lessonId"
    ],
    "hierarchy_parent_key": "module_id",
    "system_field_guard": "public.lesson_field_values.field_name must never equal 'lessonId'",
    "atomic_import_rpc": [
      "public.import_lessons_create_atomic",
      "public.import_lessons_update_atomic"
    ],
    "json_contract": {
      "update_identity_key": "lessonId",
      "create_parent_key": "moduleId",
      "optional_update_parent_key": "moduleId"
    }
  },
  "group_authority": {
    "primary": "supabase",
    "tables": [
      "public.groups",
      "public.group_field_values"
    ],
    "core_columns": [
      "id",
      "lesson_id",
      "title",
      "text",
      "subtitle",
      "created_at"
    ],
    "dynamic_storage_key": [
      "group_id",
      "component_name",
      "category_name",
      "field_name"
    ],
    "required_rule_source": "public.field_dictionary_component_rules.is_required (component_name = 'groups')",
    "system_controlled_fields": [
      "groupId"
    ],
    "hierarchy_parent_key": "lesson_id",
    "system_field_guard": "public.group_field_values.field_name must never equal 'groupId'",
    "atomic_import_rpc": [
      "public.import_groups_create_atomic",
      "public.import_groups_update_atomic"
    ],
    "json_contract": {
      "update_identity_key": "groupId",
      "create_parent_key": "lessonId",
      "optional_update_parent_key": "lessonId"
    }
  },
  "slide_authority": {
    "primary": "supabase",
    "tables": [
      "public.slides",
      "public.slide_field_values"
    ],
    "core_columns": [
      "id",
      "group_id",
      "created_at"
    ],
    "dynamic_storage_key": [
      "slide_id",
      "component_name",
      "category_name",
      "field_name"
    ],
    "required_rule_source": "public.field_dictionary_component_rules.is_required (component_name = 'slides')",
    "system_controlled_fields": [
      "slideId"
    ],
    "hierarchy_parent_key": "group_id",
    "system_field_guard": "public.slide_field_values.field_name must never equal 'slideId'",
    "atomic_import_rpc": [
      "public.import_slides_create_atomic",
      "public.import_slides_update_atomic"
    ],
    "json_contract": {
      "update_identity_key": "slideId",
      "create_parent_key": "groupId",
      "optional_update_parent_key": "groupId"
    }
  },
  "hierarchy": {
    "implemented_runtime": [
      "levels",
      "modules",
      "lessons",
      "groups",
      "slides"
    ],
    "declared_future": [],
    "levels": {
      "description": "Level is an internal OuiiSpeak mastery stage.",
      "items": [
        "Level 1",
        "Level 2",
        "Level 3",
        "Level 4",
        "Level 5",
        "Level 6",
        "Level 7",
        "Level 8",
        "Level 9",
        "Level 10"
      ]
    }
  },
  "new_component_protocol": {
    "law": "Any new component must be introduced through Supabase authority first, then projected to runtime config, then implemented in UI/routes, then mirrored in central/docs. Partial onboarding is invalid.",
    "must_create": [
      "central/<component>/ (folder)",
      "central/<component>/<COMPONENT>_LAWS.md",
      "central/SOT/<component>_configs.md",
      "lib/<component>.ts",
      "app/<component>/page.tsx",
      "app/edit-<component>/[<componentId>]/page.tsx",
      "app/api/<component>/export-json/route.ts (optional)",
      "app/api/<component>/import-json/route.ts (optional)",
      "supabase/manual/<nnn>_<component>_setup.sql (or approved update to existing chain)"
    ],
    "must_update_supabase": [
      "Create/alter component runtime table(s)",
      "Create/alter component dynamic values table with FK to public.component_config_fields",
      "Set component presence/required via public.set_field_dictionary_component_presence",
      "Verify projection rows in public.component_config_fields",
      "Verify required flags in public.field_dictionary_component_rules"
    ],
    "must_update_documents": [
      "README.md",
      "docs/FACTORY_RESET_SCOPE.md",
      "docs/LOCAL_SUPABASE_MANUAL_SETUP.md",
      "central/CONSTITUTION.md",
      "central/ORDER_OF_OPERATIONS.md",
      "central/HIERARCHY_LAW_AUDIT.md",
      "central/Configs/CONFIG_LAW.md",
      "central/SOT/universal_configs.md",
      "central/SOT/<component>_configs.md",
      "central/<component>/<COMPONENT>_LAWS.md"
    ],
    "verification_gate_before_done": [
      "DB schema and authority queries pass",
      "Component required rules enforce correctly from public.field_dictionary_component_rules",
      "Create/edit/import/export behavior matches laws",
      "npm run check passes",
      "All listed docs reflect current runtime behavior"
    ]
  },
  "quality_gate": {
    "command": "npm run check",
    "steps": [
      "npm run lint",
      "npm run typecheck",
      "npm run test",
      "npm run build"
    ]
  }
}
