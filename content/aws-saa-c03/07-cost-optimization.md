---
title: Cost optimization and architecture fit
topic: aws-saa-c03
order: 7
---

# Cost optimization and architecture fit

## The big picture
A good AWS architecture does more than work. It also matches cost to real value: right-size workloads, automate scale, and remove waste without harming reliability.

## Core building blocks
- Rightsizing: pick the smallest viable compute and storage footprint.
- Auto Scaling: scale capacity to demand instead of paying for idle headroom.
- Managed services: reduce operational overhead and avoid underutilized infrastructure.
- Storage lifecycle policies: move infrequently used data to cheaper storage tiers.

## Real project example
An online service scales compute automatically during peak hours, stores old logs in lower-cost object storage, and turns off non-production resources during off-hours. Cost drops while user experience stays stable.

## Decision flow
- Need more capacity only during planned spikes? Use Auto Scaling and scheduled actions.
- Are there idle resources? Rightsize or stop non-prod usage.
- Are logs or backups cheap to archive? Move them to lower-cost storage tiers.

## Good practice
Always ask: what is the business value of this capacity? If a resource is not contributing to user value or reliability, it is usually a cost smell.

> **Pro tip:** cost optimization is architecture design. It is not a separate cleanup task after the system is built.

## Looking back at the big picture
The best AWS architecture is both reliable and economically sensible. Cost-aware design is a core skill for architects, not a side concern.

## Self-draw
- Which workload should scale automatically?
- What does rightsizing mean in practice?
- Why is lifecycle management important for data cost control?
