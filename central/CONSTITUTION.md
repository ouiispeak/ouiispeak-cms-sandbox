{
  "date": "2026-04-07",
  "last_updated": "2026-04-10",
  "owner": "CMS Platform (Sandbox Data Lane)",
  "repository": "ouiispeak-cms-sandbox",
  "hard_facts": {
    "HF-IDENTITY-001": "slideId is the only legal slide-family identity key in CMS sandbox contracts, ingest/export payloads, and runtime surfaces.",
    "HF-IDENTITY-001_forbidden": "slideUuid is forbidden.",
    "HF-IDENTITY-001_enforcement": "No aliasing, fallback mapping, translation layer, or dual-key acceptance is allowed."
  },
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
      "central/SOT/slides_configs.md",
      "central/SOT/activity_slides_configs.md",
      "central/SOT/title_slides_configs.md",
      "central/SOT/lesson_ends_configs.md"
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
    },
    "activity_slides": {
      "identityFieldKey": "slideId",
      "identityDbColumn": "id",
      "parentFieldKey": "groupId",
      "parentDbColumn": "group_id",
      "coreFieldDbColumns": {}
    },
    "title_slides": {
      "identityFieldKey": "slideId",
      "identityDbColumn": "id",
      "parentFieldKey": "lessonId",
      "parentDbColumn": "lesson_id",
      "coreFieldDbColumns": {}
    },
    "lesson_ends": {
      "identityFieldKey": "slideId",
      "identityDbColumn": "id",
      "parentFieldKey": "lessonId",
      "parentDbColumn": "lesson_id",
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
      "slides.group_id": "uuid",
      "activity_slides.id": "uuid",
      "activity_slides.group_id": "uuid",
      "title_slides.id": "uuid",
      "title_slides.lesson_id": "uuid",
      "lesson_ends.id": "uuid",
      "lesson_ends.lesson_id": "uuid"
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
      "slides_update_optional_parent": "groupId",
      "activity_slides_create_parent": "groupId",
      "activity_slides_update": "slideId",
      "activity_slides_update_optional_parent": "groupId",
      "title_slides_create_parent": "lessonId",
      "title_slides_update": "slideId",
      "title_slides_update_optional_parent": "lessonId",
      "lesson_ends_create_parent": "lessonId",
      "lesson_ends_update": "slideId",
      "lesson_ends_update_optional_parent": "lessonId"
    },
    "ui_route_params": [
      "[moduleId]",
      "[lessonId]",
      "[groupId]",
      "[slideId]",
      "[activitySlideId]",
      "[titleSlideId]",
      "[lessonEndId]"
    ],
    "route_param_rule": "Route params that carry entity identities must be singular camelCase + Id and values are UUID."
  },
  "requiredness_contract": {
    "status": "active",
    "authority_precedence": "sandbox-cms-wins",
    "canonical_matrix": "central/REQUIREDNESS_MATRIX.csv",
    "no_assumption_rule": [
      "Missing requiredness evidence is recorded as UNKNOWN and treated as blocking.",
      "Requiredness must not be inferred from naming patterns or historical behavior.",
      "Every requiredness decision must include evidence_source and evidence_reference."
    ],
    "flags": {
      "required_from_lv2": "Field must be present in inbound LV2 payload.",
      "required_at_ingest": "CMS ingest route must reject payload when field is missing/empty.",
      "required_in_db": "Field or invariant must exist after successful write.",
      "required_for_runtime": "Field must exist before export/player handoff.",
      "system_generated": "Field is generated by CMS or DB; LV2 may omit.",
      "generator_owner": "One of lv2, cms, db, unknown."
    },
    "hard_rule": "If required_for_runtime or required_in_db is true and system_generated is false, then required_from_lv2 must be true.",
    "gate_matrix": {
      "G1_ingest": "Reject missing required_from_lv2=true fields.",
      "G2_post_write_db": "Reject success response when required_in_db=true or system_generated=true invariants are missing.",
      "G3_export_runtime": "Fail closed when required_for_runtime=true fields are missing.",
      "G4_drift_ci": "Fail CI when requiredness matrix diverges from shape-lock, activation rules, or validators."
    }
  },
  "field_generation_policy": {
    "system_generated_payload_fields": {
      "db_owned": [
        "moduleId",
        "lessonId",
        "groupId",
        "slideId"
      ],
      "cms_owned": [
        "lastUpdatedAt",
        "targetLanguage"
      ],
      "cms_owned_conditional": [
        "orderIndex (lesson_ends lane)"
      ]
    },
    "slug": {
      "classification": "canonical_identity_key_not_system_generated",
      "policy": [
        "Create: if slug is missing, derive from title using kebab-case and enforce uniqueness within component + parent scope.",
        "Update: slug remains stable unless explicitly overridden.",
        "Legacy backfill: rows with empty slug must be backfilled once and then treated as stable."
      ]
    },
    "sourceVersion": {
      "classification": "lv2_owned_with_default",
      "policy": [
        "Current default when omitted is v1.",
        "Until LV2 return-loop revisioning is enabled, sourceVersion should remain v1 unless explicitly supplied."
      ]
    },
    "version": {
      "classification": "cms_owned_revision_counter",
      "policy": [
        "Create initializes version to 1.",
        "Accepted update/reingest with actual change increments version.",
        "Inbound LV2 version value is ignored once CMS ownership is active."
      ]
    }
  },
  "naming_decisions": {
    "ACT-NAMING-001": {
      "status": "closed",
      "decision_date": "2026-04-09",
      "scope": [
        "slides",
        "activity_slides",
        "title_slides",
        "lesson_ends",
        "player-lv2-json-contract"
      ],
      "final_choice": "slideId is the canonical update identity key.",
      "forbidden_legacy_key": "slideUuid",
      "enforcement": "No aliasing, fallback mapping, or dual-key acceptance. Payloads must use slideId."
    },
    "CMP-NAMING-001": {
      "status": "closed",
      "decision_date": "2026-04-09",
      "component": "lesson_ends",
      "final_choice": "lesson_ends is the canonical component token; URL collection slug is lesson-ends; route param is lessonEndId; DB FK is lesson_end_id.",
      "forbidden_variants": [
        "Lesson End Slide",
        "lesson end",
        "lesson ends",
        "lesson-end",
        "lesson-ends"
      ],
      "enforcement": "No aliasing or fallback naming. Contracts/component_name must use lesson_ends; URL collections use lesson-ends; entity IDs use singular forms."
    },
    "NAMING-LAYER-001": {
      "status": "closed",
      "decision_date": "2026-04-09",
      "principle": "Component tokens are plural; entity identifiers are singular.",
      "rules": [
        "Contract/component tokens use plural snake_case.",
        "Collection URL slugs use plural kebab-case.",
        "Entity action route slugs use singular kebab-case.",
        "Route params and JSON entity IDs use singular camelCase + Id.",
        "DB FK columns and row-identity columns use singular snake_case + _id."
      ],
      "examples": {
        "component_token": "lesson_ends",
        "collection_slug": "lesson-ends",
        "entity_action_slug": "lesson-end",
        "route_param": "lessonEndId",
        "db_fk": "lesson_end_id"
      },
      "zero_exceptions": true
    }
  },
  "field_addition_law": {
    "id": "FIELD-ADDING-LAW-001",
    "status": "active",
    "decision_date": "2026-04-09",
    "law": "A field addition is complete only when authority SQL seeds, projection activation, SOT mirrors, and verification gates are all updated in one change.",
    "four_naming_conventions": {
      "component_tokens": "plural snake_case",
      "route_slugs": "collection routes plural kebab-case; entity edit routes singular kebab-case",
      "route_params_and_json_entity_ids": "singular camelCase + Id",
      "db_fk_and_row_identity_columns": "singular snake_case + _id"
    },
    "field_naming_rules": [
      "field_dictionary.field_key must be camelCase and must match the runtime JSON key exactly.",
      "field keys must not include spaces, hyphens, or underscores.",
      "identity field keys must end with Id (moduleId, lessonId, groupId, slideId).",
      "category_name must exactly match public.config_categories.name."
    ],
    "field_key_regex": "^[a-z][A-Za-z0-9]*$",
    "allowed_input_types": [
      "text",
      "textarea",
      "number",
      "checkbox",
      "select",
      "json",
      "list",
      "audio_selector",
      "audio_list",
      "audio_prompt",
      "blanks_mapper",
      "audio_lines_mapper",
      "choice_elements_mapper",
      "match_pairs_mapper",
      "avatar_dialogues_mapper",
      "media_picker"
    ],
    "authority_write_path": [
      "public.upsert_field_dictionary_entry(field_key, category_name, input_type, field_order, status, definition)",
      "public.set_field_dictionary_component_presence(field_key, component_name, is_present, is_required)",
      "public.set_universal_field_order(category_name, field_name, field_order) when reordering is required",
      "public.rename_universal_field(old_name, new_name) only for explicit renames"
    ],
    "required_file_updates": {
      "always": [
        "supabase/manual/010_field_dictionary_catalog_seed.sql",
        "supabase/manual/012_component_activation_seed.sql",
        "central/SOT/universal_configs.md",
        "central/CONSTITUTION.md"
      ],
      "component_sot_mirror_files_when_present_true": {
        "modules": "central/SOT/module_configs.md",
        "lessons": "central/SOT/lessons_configs.md",
        "groups": "central/SOT/groups_configs.md",
        "slides": "central/SOT/slides_configs.md",
        "activity_slides": "central/SOT/activity_slides_configs.md",
        "title_slides": "central/SOT/title_slides_configs.md",
        "lesson_ends": "central/SOT/lesson_ends_configs.md"
      },
      "always_if_catalog_counts_change": [
        "central/HIERARCHY_LAW_AUDIT.md"
      ],
      "conditional": {
        "if_new_category_added": [
          "supabase/manual/010_field_dictionary_catalog_seed.sql (INSERT INTO public.config_categories block)",
          "supabase/manual/002_config_authority_setup.sql (bootstrap config_categories list)",
          "central/HIERARCHY_LAW_AUDIT.md (active category set counts)"
        ],
        "if_field_changes_lesson_ends_shape_lock": [
          "central/CONSTITUTION.md (lesson_ends_shape_lock keys/rules)",
          "central/Configs/CONFIG_LAW.md",
          "tests/drift-gates.test.ts"
        ],
        "if_field_changes_activity_profile_or_act_shape_lock": [
          "lib/activityShapeLock.ts",
          "lib/activityProfiles.ts",
          "tests/activity-profile-config.test.ts",
          "tests/drift-gates.test.ts",
          "central/SOT/activity_slides_configs.md",
          "supabase/manual/012_component_activation_seed.sql"
        ],
        "if_new_input_type_added": [
          "supabase/manual/004_field_dictionary_authority_setup.sql (field_dictionary_input_type_check)",
          "lib/universalConfigs.ts (toInputType and COMPLEX_CUSTOM_INPUT_TYPES when applicable)",
          "lib/exportTemplateValues.ts",
          "components/CustomFieldInput.tsx when input is custom-complex",
          "central/SOT/universal_configs.md"
        ]
      }
    },
    "execution_order": [
      "Define field spec first: field_key, category_name, input_type, field_order, status, definition.",
      "Validate naming rules before edits: field_key regex and category exact match.",
      "Update supabase/manual/010_field_dictionary_catalog_seed.sql with the dictionary row and category ordering if needed.",
      "Update supabase/manual/012_component_activation_seed.sql with explicit per-component is_present/is_required rows.",
      "Update central/SOT/universal_configs.md.",
      "Update each component SOT mirror listed in component_sot_mirror_files_when_present_true where is_present = true.",
      "Update central/HIERARCHY_LAW_AUDIT.md when category counts or active field counts changed.",
      "If the change touches shape-lock or activity profile rules, apply all conditional file updates.",
      "Run local SQL verification queries against field_dictionary, universal_fields, field_dictionary_component_rules, and component_config_fields.",
      "Run npm test, npm run typecheck, and npm run build.",
      "Do not mark done unless all required and conditional files are aligned."
    ],
    "verification_queries": [
      "SELECT field_key, category_name, input_type, field_order, status FROM public.field_dictionary WHERE field_key = '<fieldKey>';",
      "SELECT name, category_name, input_type, field_order FROM public.universal_fields WHERE name = '<fieldKey>';",
      "SELECT component_name, is_present, is_required FROM public.field_dictionary_component_rules WHERE field_key = '<fieldKey>' ORDER BY component_name;",
      "SELECT component_name, category_name, field_name FROM public.component_config_fields WHERE field_name = '<fieldKey>' ORDER BY component_name;"
    ],
    "completion_gate": [
      "No naming drift from NAMING-LAYER-001.",
      "No direct writes to projection tables in code paths (public.universal_fields/public.component_config_fields).",
      "All required mirrors updated.",
      "All verification checks pass."
    ]
  },
  "authority_registry": {
    "law": "Each artifact type has exactly one canonical authority source. Mirrors, guides, drafts, and audits are non-authoritative and must reference their canonical source.",
    "conflict_rule": "If canonical and non-canonical artifacts disagree, the canonical source wins.",
    "no_duplicate_authority": true,
    "downstream_constitution_reference_required": true,
    "documentation_token_policy": {
      "law": "Downstream markdown docs must use exact canonical component tokens when naming components.",
      "canonical_component_tokens": [
        "modules",
        "lessons",
        "groups",
        "slides",
        "activity_slides",
        "title_slides",
        "lesson_ends"
      ],
      "forbidden_non_canonical_component_labels": [
        "activity slide",
        "activity slides",
        "title slide",
        "title slides",
        "lesson end",
        "lesson ends"
      ]
    },
    "artifact_types": {
      "repository_governance_and_naming": {
        "canonical_source": "central/CONSTITUTION.md",
        "canonical_scope": [
          "identity_contract",
          "naming_decisions",
          "field_addition_law",
          "authority_registry"
        ],
        "allowed_non_canonical_artifacts": [
          "README.md",
          "central/Configs/CONFIG_LAW.md",
          "central/modules/MODULE_LAWS.md",
          "central/lessons/LESSON_LAWS.md",
          "central/groups/GROUP_LAWS.md",
          "central/slides/SLIDE_LAWS.md",
          "central/activity-slides/ACTIVITY_SLIDE_LAWS.md",
          "central/title-slides/TITLE_SLIDE_LAWS.md"
        ]
      },
      "lv2_json_contract": {
        "canonical_source": "central/INGEST_CONTRACT.md",
        "allowed_non_canonical_artifacts": [
          "README.md",
          "central/CONSTITUTION.md",
          "central/LV2_JSON_CONTRACT_LAW.md"
        ]
      },
      "activity_runtime_profile_matrix": {
        "canonical_source": "central/ACTIVITY_PROFILES.md",
        "allowed_non_canonical_artifacts": [
          "README.md",
          "central/activity-slides/ACTIVITY_SLIDE_LAWS.md"
        ]
      },
      "field_catalog_runtime": {
        "canonical_source": "public.field_dictionary",
        "repo_seed_snapshot": "supabase/manual/010_field_dictionary_catalog_seed.sql",
        "projection_table": "public.universal_fields",
        "allowed_non_canonical_artifacts": [
          "central/SOT/universal_configs.md",
          "central/FIELD_DICTIONARY.md",
          "central/FIELD_DICTIONARY.csv",
          "docs/LOCAL_SUPABASE_MANUAL_SETUP.md"
        ]
      },
      "component_activation_runtime": {
        "canonical_source": "public.field_dictionary_component_rules",
        "repo_seed_snapshot": "supabase/manual/012_component_activation_seed.sql",
        "projection_table": "public.component_config_fields",
        "allowed_non_canonical_artifacts": [
          "central/SOT/module_configs.md",
          "central/SOT/lessons_configs.md",
          "central/SOT/groups_configs.md",
          "central/SOT/slides_configs.md",
          "central/SOT/activity_slides_configs.md",
          "central/SOT/title_slides_configs.md",
          "central/SOT/lesson_ends_configs.md"
        ]
      },
      "runtime_component_mapping": {
        "canonical_source": "lib/canonicalFieldMap.ts",
        "allowed_non_canonical_artifacts": [
          "central/CONSTITUTION.md",
          "central/INGEST_CONTRACT.md",
          "central/LV2_JSON_CONTRACT_LAW.md"
        ]
      },
      "open_items_log": {
        "canonical_source": "central/OPEN_ITEMS.md",
        "allowed_non_canonical_artifacts": [
          "README.md"
        ]
      },
      "operations_runbook": {
        "canonical_source": "central/ORDER_OF_OPERATIONS.md",
        "allowed_non_canonical_artifacts": [
          "docs/LOCAL_SUPABASE_MANUAL_SETUP.md",
          "README.md"
        ]
      },
      "database_schema_model": {
        "canonical_source": "central/SCHEMA.md",
        "allowed_non_canonical_artifacts": [
          "docs/LOCAL_SUPABASE_MANUAL_SETUP.md",
          "central/ORDER_OF_OPERATIONS.md",
          "README.md"
        ]
      },
      "audit_evidence": {
        "canonical_source": "central/HIERARCHY_LAW_AUDIT.md",
        "allowed_non_canonical_artifacts": []
      }
    }
  },
  "setup_sql_order": [
    "supabase/manual/001_levels_setup.sql",
    "supabase/manual/002_config_authority_setup.sql",
    "supabase/manual/004_field_dictionary_authority_setup.sql",
    "supabase/manual/009_uuid_identity_reset.sql",
    "supabase/manual/010_field_dictionary_catalog_seed.sql",
    "supabase/manual/011_text_slide_component_setup.sql",
    "supabase/manual/012_component_activation_seed.sql",
    "supabase/manual/013_title_slide_boundary_setup.sql",
    "supabase/manual/014_lesson_ends_boundary_setup.sql",
    "supabase/manual/015_act_001_slide_setup.sql",
    "supabase/manual/016_activity_slides_setup.sql"
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
  "title_slide_authority": {
    "primary": "supabase",
    "tables": [
      "public.title_slides",
      "public.title_slide_field_values"
    ],
    "core_columns": [
      "id",
      "lesson_id",
      "created_at"
    ],
    "dynamic_storage_key": [
      "title_slide_id",
      "component_name",
      "category_name",
      "field_name"
    ],
    "required_rule_source": "public.field_dictionary_component_rules.is_required (component_name = 'title_slides')",
    "system_controlled_fields": [
      "slideId"
    ],
    "hierarchy_parent_key": "lesson_id",
    "system_field_guard": "public.title_slide_field_values.field_name must never equal 'slideId'",
    "atomic_import_rpc": [
      "public.import_title_slides_create_atomic",
      "public.import_title_slides_update_atomic"
    ],
    "json_contract": {
      "update_identity_key": "slideId",
      "create_parent_key": "lessonId",
      "optional_update_parent_key": "lessonId"
    }
  },
  "activity_slide_authority": {
    "primary": "supabase",
    "tables": [
      "public.activity_slides",
      "public.activity_slide_field_values"
    ],
    "core_columns": [
      "id",
      "group_id",
      "created_at"
    ],
    "dynamic_storage_key": [
      "activity_slide_id",
      "component_name",
      "category_name",
      "field_name"
    ],
    "required_rule_source": "public.field_dictionary_component_rules.is_required (component_name = 'activity_slides')",
    "system_controlled_fields": [
      "slideId"
    ],
    "hierarchy_parent_key": "group_id",
    "system_field_guard": "public.activity_slide_field_values.field_name must never equal 'slideId'",
    "atomic_import_rpc": [
      "public.import_activity_slides_create_atomic",
      "public.import_activity_slides_update_atomic"
    ],
    "json_contract": {
      "update_identity_key": "slideId",
      "create_parent_key": "groupId",
      "optional_update_parent_key": "groupId"
    }
  },
  "lesson_ends_shape_lock": {
    "component_label": "lesson_ends",
    "component_name": "lesson_ends",
    "status": "runtime-db-tables-active-cms-edit-create-import-export-active",
    "runtime_tables": [
      "public.lesson_ends",
      "public.lesson_end_field_values"
    ],
    "runtime_field_value_identity_keys": [
      "lessonId",
      "moduleId",
      "slideId",
      "slug",
      "orderIndex"
    ],
    "top_level_keys": [
      "lessonId",
      "slideId"
    ],
    "system_field_guard": "public.lesson_end_field_values.field_name must never equal 'slideId'",
    "rules": [
      "for CMS JSON routes, category payloads must not include top-level identity/parent keys",
      "required baseline keys are lessonId, moduleId, slideId, slug, orderIndex",
      "current player B2 runtime reads lesson_ends baseline identity keys from lesson_end_field_values",
      "titleModule is forbidden",
      "source fields are mirrored in central/SOT/lesson_ends_configs.md"
    ]
  },
  "hierarchy": {
    "implemented_runtime": [
      "levels",
      "modules",
      "lessons",
      "groups",
      "slides",
      "activity_slides",
      "title_slides",
      "lesson_ends"
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
  "lv2_json_contract_law": "central/INGEST_CONTRACT.md",
  "activity_profiles": "central/ACTIVITY_PROFILES.md",
  "open_items_log": "central/OPEN_ITEMS.md",
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
