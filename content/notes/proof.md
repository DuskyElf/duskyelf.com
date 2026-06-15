---
title: Proof
date: 2026-06-14
tags:
  - maths
  - logic
---

# Proof

![proof-excalidraw](./proof.excalidraw)

A mathematical proof is a verification of a [proposition](#proposition) by a chain of [logical deductions](#logical-deductions) from a base set of [axioms](#axiom).

## Proposition

A proposition is a statement that is either true or false.

## Predicate

A parameterized statement that is not yet a complete proposition. It usually expresses a property of an object, or a relationship between objects.

## Logical deductions

Propositions can be combined using Boolean Logic Gates to form new propositions. An **inference rules** is a rule for combining true propositions to form other true propositions.

### Common inference rules

**Modus Pones**: if $(P \land (P \implies Q))$ then $Q$ [see [[implication]]]

**Contrapositive**: $((P \implies Q) \land \lnot Q) \implies \lnot P$ [see [[implication#contrapositive]]]

## Axiom

An Axiom is a proposition we assume is true.

A set of axioms is **consistent** when you can't prove that false is true.

A set of axioms is **complete** when every true proposition can be proved from the axioms.

### Gödel's Incompleteness

Gödel's Incompleteness theorem proved that you can't have both (complete and consistent) as long as it's complicated enough to do arithmetic.

