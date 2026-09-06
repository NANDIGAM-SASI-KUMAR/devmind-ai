// A harder, larger evaluation set designed specifically to give Recall@K/MRR/nDCG room to
// actually differentiate baseline (dense-only) from advanced (hybrid+rerank+MMR) — the
// original 6-section dataset was too small and too topically distinct per section, so both
// modes hit 100% recall trivially (a ceiling effect, honestly reported in the Phase 2
// write-up). This document deliberately contains several sections that are SEMANTICALLY
// SIMILAR but factually distinct (three different consensus algorithms, three different
// consistency models), which is exactly the situation dense-only embeddings tend to
// conflate and BM25 exact-term matching + reranking is supposed to disambiguate.
export const HARD_TEST_DOCUMENT = `# Distributed Systems Fundamentals

A distributed system is a collection of independent computers that appears to its users as a single coherent system. Distributed systems must handle network partitions, node failures, and message delays.

## CAP Theorem

The CAP theorem states that a distributed data store can only provide two of the following three guarantees simultaneously: Consistency, Availability, and Partition tolerance. Since network partitions are unavoidable in practice, real systems must choose between consistency and availability during a partition.

# Consensus Algorithms

Consensus algorithms allow a group of distributed nodes to agree on a single value even when some nodes fail.

## Paxos

Paxos is a consensus algorithm that uses a two-phase protocol: a prepare phase and an accept phase. A proposer sends a prepare request with a proposal number to a majority of acceptors. Paxos is notoriously difficult to implement correctly due to its abstract formulation.

## Raft

Raft is a consensus algorithm designed to be more understandable than Paxos. Raft divides consensus into leader election, log replication, and safety. A Raft cluster elects a single leader that handles all client requests and replicates log entries to follower nodes. If the leader fails, a new election is triggered using randomized timeouts.

## Byzantine Fault Tolerance

Byzantine fault tolerance handles a stronger failure model where nodes may behave arbitrarily or maliciously, not just crash. Practical Byzantine Fault Tolerance (PBFT) requires more than two-thirds of nodes to be honest to reach agreement, unlike Paxos and Raft which only tolerate crash failures.

# Consistency Models

Consistency models define the guarantees a distributed system makes about the order and visibility of updates.

## Strong Consistency

Strong consistency guarantees that after a write completes, all subsequent reads from any node will see that write immediately. This typically requires coordination between nodes on every operation, which increases latency.

## Eventual Consistency

Eventual consistency guarantees that if no new updates are made, all replicas will eventually converge to the same value, but reads may temporarily return stale data. Eventual consistency favors availability and low latency over immediate correctness.

## Causal Consistency

Causal consistency guarantees that operations which are causally related are seen by all nodes in the same order, while concurrent operations with no causal relationship may be seen in different orders on different nodes. It is stronger than eventual consistency but weaker than strong consistency.

# Replication Strategies

## Leader-Follower Replication

In leader-follower replication, all writes go to a single leader node, which then propagates changes to follower nodes. Reads can be served by followers, which improves read scalability but risks serving stale data if replication lags.

## Multi-Leader Replication

Multi-leader replication allows writes to be accepted at multiple nodes simultaneously, which is useful for multi-datacenter deployments, but introduces the risk of write conflicts that must be resolved.

## Leaderless Replication

Leaderless replication, used by systems like Dynamo, allows any replica to accept writes directly from clients. Leaderless systems typically use quorum reads and writes to maintain consistency guarantees.`;

export const HARD_EVAL_DATASET = [
  {
    id: 'h1_disambiguate_consensus',
    question: 'Which consensus algorithm was specifically designed to be easier to understand than Paxos?',
    category: 'disambiguation', // Paxos and Raft are both "consensus algorithms" — dense embeddings may conflate them; only the exact fact "easier to understand than Paxos" disambiguates to Raft
    expectedSections: ['Raft'],
    expectAnswerable: true,
    expectedKeywords: ['raft']
  },
  {
    id: 'h2_exact_term',
    question: 'What fraction of nodes must be honest for PBFT to reach agreement?',
    category: 'exact_keyword',
    expectedSections: ['Byzantine Fault Tolerance'],
    expectAnswerable: true,
    expectedKeywords: ['two-thirds', '2/3']
  },
  {
    id: 'h3_disambiguate_consistency',
    question: 'Which consistency model allows reads to temporarily return stale data but guarantees convergence eventually?',
    category: 'disambiguation', // "consistency model" spans 3 near-duplicate sections; specific phrase "stale data... eventually" pins it to Eventual Consistency, not Strong or Causal
    expectedSections: ['Eventual Consistency'],
    expectAnswerable: true,
    expectedKeywords: ['eventual', 'converge']
  },
  {
    id: 'h4_disambiguate_replication',
    question: 'Which replication strategy is most at risk of write conflicts because multiple nodes accept writes at once?',
    category: 'disambiguation',
    expectedSections: ['Multi-Leader Replication'],
    expectAnswerable: true,
    expectedKeywords: ['multi-leader', 'conflict']
  },
  {
    id: 'h5_semantic_paraphrase',
    question: 'What happens to a Raft cluster if the current leader stops responding?',
    category: 'semantic_paraphrase', // no exact keyword overlap with "leader fails" phrasing in the source
    expectedSections: ['Raft'],
    expectAnswerable: true,
    expectedKeywords: ['election', 'timeout']
  },
  {
    id: 'h6_multi_section',
    question: 'How does the CAP theorem relate to the tradeoff between strong and eventual consistency?',
    category: 'multi_hop',
    expectedSections: ['CAP Theorem', 'Strong Consistency', 'Eventual Consistency'],
    expectAnswerable: true,
    expectedKeywords: ['availability', 'partition']
  },
  {
    id: 'h7_ordering_specific',
    question: 'What ordering guarantee applies only to causally related operations, not concurrent ones?',
    category: 'disambiguation',
    expectedSections: ['Causal Consistency'],
    expectAnswerable: true,
    expectedKeywords: ['causal']
  },
  {
    id: 'h8_not_covered',
    question: 'How does the Gossip protocol propagate membership information in a cluster?',
    category: 'not_covered', // Gossip is a real, plausible-sounding distributed-systems topic never mentioned in this document
    expectedSections: [],
    expectAnswerable: false,
    expectedKeywords: []
  },
  {
    id: 'h9_similar_but_uncovered',
    question: 'How does Google Spanner achieve external consistency using TrueTime?',
    category: 'similar_but_incorrect_evidence', // topically "distributed consistency," but Spanner/TrueTime never mentioned
    expectedSections: [],
    expectAnswerable: false,
    expectedKeywords: []
  },
  {
    id: 'h10_leaderless_exact',
    question: 'What technique do leaderless replication systems like Dynamo use to maintain consistency?',
    category: 'exact_keyword',
    expectedSections: ['Leaderless Replication'],
    expectAnswerable: true,
    expectedKeywords: ['quorum']
  }
];
