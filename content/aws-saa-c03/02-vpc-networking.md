---
title: VPC and networking foundations
topic: aws-saa-c03
order: 2
---

# VPC and networking foundations

## The big picture
A VPC is the private network boundary for your AWS workloads. It decides what can talk to what, where traffic enters, and how services reach the internet or each other.

## Core building blocks
- VPC: the isolated virtual network.
- Subnets: split the VPC into public and private areas.
- Route tables: decide where traffic leaves each subnet.
- Security groups: stateful firewall at instance level.
- Network ACLs: subnet-level rule set.

## Real project example
A three-tier web app runs web servers in a public subnet, application servers in a private subnet, and a database in another private subnet. Public traffic reaches the web tier only, while the database is not directly exposed.

## Network decision flow
1. Public subnet needs internet access? Attach an Internet Gateway.
2. Private tier needs outbound internet only? Use a NAT Gateway.
3. Need cross-environment communication? Use VPC peering, Transit Gateway, or VPN.

> **Pro tip:** design your network around trust boundaries. The public edge should be narrow; private services should not be directly reachable from the internet.

## Looking back at the big picture
The VPC is the network map of the system. If the network is confused, everything above it becomes harder to secure and debug.

## Self-draw
- What is the purpose of a public subnet?
- Why is the database usually placed in a private subnet?
- When would you prefer NAT over direct internet access?
