---
title: Disaster recovery and high availability
topic: aws-saa-c03
order: 8
---

# Disaster recovery and high availability

## The big picture
High availability means a service keeps working despite failures. Disaster recovery adds the ability to recover after a larger event, such as a regional outage or data center loss.

## Core building blocks
- Multi-AZ: spread resources across availability zones.
- Multi-region: recover across AWS regions.
- RTO and RPO: recovery time objective and recovery point objective.
- Route 53 health checks: route around failures.

## Real project example
An online shop uses ALB in two AZs, deploys the database with Multi-AZ, and keeps a secondary region ready for failover. The business can restore access quickly with a defined RTO under an outage scenario.

## Decision flow
- Need resilience within one region? Use Multi-AZ and load balancing.
- Need resilience across regions? Use multi-region replication and DNS failover.
- Need to measure recovery quality? Define RPO and RTO before designing the system.

## Good practice
Design for failure early. If recovery time is vague, the architecture is not mature enough for production service levels.

> **Pro tip:** availability design is a business requirement, not an afterthought.

## Looking back at the big picture
The target is not "zero failures" but predictable recovery. Architecture should reduce blast radius and provide a defined path back to service.

## Self-draw
- What is the difference between Multi-AZ and multi-region?
- Why are RTO and RPO critical in DR planning?
- Which service helps direct traffic away from a failed region or endpoint?
