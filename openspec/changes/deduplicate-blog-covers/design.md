# Design

Use the 34 existing technology originals in `image-archive/originals/technology` as the source pool. Generate 1600x900 WebP derivatives at `source/img/covers/dedup-XX.webp`, preserving the archive as the attribution and provenance record.

Assign one derivative to each post currently using a duplicated technology cover or one of the two placeholder OSS cover URLs. Keep the mapping deterministic by sorting affected posts by their existing cover group and path.
