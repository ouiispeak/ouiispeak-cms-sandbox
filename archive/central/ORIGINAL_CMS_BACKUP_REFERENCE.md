Authority Role: canonical
Artifact Type: backup-reference
Canonical Source: archive/central/ORIGINAL_CMS_BACKUP_REFERENCE.md
Constitution Reference: central/CONSTITUTION.md

# Original CMS Backup Reference

Date: 2026-04-11
Owner: Raychel Johnson
Repository: ouiispeak-cms-sandbox

## Purpose
Record the immutable backup reference for the retired original CMS lane.

## Source Snapshot Identity
1. Source repo path: `/Users/raycheljohnson/Desktop/ouiispeak-cms`
2. Source branch at freeze: `cms/wp-h0-mapper-abstraction`
3. Source commit at freeze: `d306271af149ca8c71db9ba73df100d222386163`
4. Source tag at freeze (local annotated tag): `backup/original-cms-freeze-20260411`

## Backup Storage Location
1. Backup directory: `/Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover-backups/20260410-235434/original-cms-backup`
2. Backup bundle file: `ouiispeak-cms-d306271af149-20260411.bundle`
3. Absolute bundle path: `/Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover-backups/20260410-235434/original-cms-backup/ouiispeak-cms-d306271af149-20260411.bundle`
4. SHA-256: `c3b1ed9ea9842958836f7ab503e0dad6210cce512eedd9ef8181592757f78229`
5. Size (bytes): `2340532`
6. Reference metadata file: `/Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover-backups/20260410-235434/original-cms-backup/backup-reference.env`

## Deterministic Verification Commands
```bash
# Verify checksum
shasum -a 256 \
  /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover-backups/20260410-235434/original-cms-backup/ouiispeak-cms-d306271af149-20260411.bundle

# Verify bundle can be read
cd /Users/raycheljohnson/Desktop/ouiispeak-cms
git bundle verify \
  /Users/raycheljohnson/Developer/ouiispeak-cms-sandbox/cutover-backups/20260410-235434/original-cms-backup/ouiispeak-cms-d306271af149-20260411.bundle
```

## Status
Backup reference is recorded and closed for cutover evidence law.
