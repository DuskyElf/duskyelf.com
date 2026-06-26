---
title: Proof
date: 2026-06-26
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

## Proof outlines

<hr>

Theorem: $\exists$ $x \in S \cdot P(x)$

Proof: Choose $x = \boxed{?}$ then $x \in S$ because $\boxed{?}$ and $P(x)$ is true because $\boxed{?}$

<hr>

Theorem: $\forall$ $x \in S \cdot P(x)$

Proof: Suppose $x$ is a generic element of $S$. Then $P(x)$ is true because $\boxed{?}$

<hr>

Theorem: $P \implies Q$

**Direct Proof**: Assume $P$ then $Q$ is true because $\boxed{?}$

**Proof by [[implication#contrapositive]]**: Proof by Contrapositive, assume $Q$ is false. Then $P$ is false because $\boxed{?}$

<hr>

Theorem: $P$

Proof: For sake of contradiction, assume $P$ is false ...$\boxed{?}$... Then $R$ is both true and false, contradiction.
(So our assumption is wrong, $P$ is true)

<hr>

### Proof by 2 Cases
- take any proposition $C$
- $C \lor \lnot C$ is tautology
- show $P$ is equivalent to $(C \lor \lnot C) \implies P$
- then $(C \implies P) \land (\lnot C \implies P)$

Theorem: P

Proof: Proof by cases on the truth value of $C$
- Case 1: $C$ is true (ie. assume $C$ is true)
  - then $P$ is true because $\boxed{?}$
- Case 2: $C$ is false
  - then $P$ is true because $\boxed{?}$

$C$ is either true or false $\implies$ cases are exhaustive

<hr>

Theorem: $P$ is true

Assuming $C_1 \lor C_2 \lor \ldots \lor C_k$ is a tautology

Proof: Proof by cases
- Case i: $C_i$ is true (assume $C_i$) then $P$ is true because $\boxed{?}$

Cases are exhaustive because $\boxed{?}$

<hr>

### Principle of induction

$(P(x) \land \forall n \geq x \cdot P(n) \implies P(n + 1)) \implies (\forall n \geq x \cdot P(n))$

#### Proof by Strong Induction
if $\forall n \in \mathbb{N} \cdot [P(0) \land \ldots \land P(n - 1)] \implies P(n)$

then $\forall n \in \mathbb{N} \cdot P(n)$

This is very useful in recursive proofs, where you break down a problem into multiple recursive parts.

Theorem: $\forall n \in \mathbb{N} \cdot P(n)$

Proof: by strong induction
- assume $P(k) \forall k < n$
- WTS $P(n)$, by cases
  - base cases: $P(0), P(1), \ldots P(b)$ because $\boxed{?}$
  - induction step: assume n > b then $P(n)$ because $\boxed{?}$

<hr>

### Common Abbreviations

**WTS**: Want to show

**QED**: That which was to be demonstrated (_quod erat demonstrandum_)
