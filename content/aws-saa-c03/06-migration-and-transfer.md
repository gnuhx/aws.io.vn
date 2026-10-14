---
title: Migration and transfer patterns
topic: aws-saa-c03
order: 0
module: 7
moduleTitle: Scale & Final Review
kind: overview
---

# Migration and transfer patterns

## The big picture
Migration is not just moving a machine. It is about understanding the existing environment, choosing the right landing pattern, and keeping the business running while change happens.

## Core building blocks
- Application Discovery Service: understand dependencies and usage.
- Database Migration Service: move databases with minimal downtime.
- AWS Snow Family: transfer data physically when network is slow or limited.
- DataSync: copy data between on-prem and AWS efficiently.

## Real project example
A company with a large legacy database uses DMS to move data while keeping the old system live. They use Discovery to map dependencies before changing the target architecture.

## Decision flow
- Need to discover dependencies before migration? Use Application Discovery.
- Need database replication with low downtime? Use DMS.
- Need to move large data sets offline? Use Snowball or Snowmobile.
- Need recurring transfer between on-prem and AWS? Use DataSync.

## Good practice
Plan the migration as a sequence of controlled steps. Discovery reduces surprise; replay and validation reduce downtime risk.

> **Pro tip:** migration is usually a business continuity exercise as much as a technical one.

## Looking back at the big picture
The best migration is predictable, observable, and reversible enough to keep production stable while change occurs.

## Self-draw
- Why is discovery a prerequisite for a large migration?
- Which service is better for large offline data transfer?
- What is the main benefit of database replication during migration?
