import test from "node:test";
import assert from "node:assert/strict";

function calculateSplits(totalAmount, memberIds) {
  const totalCents = Math.round(Number(totalAmount) * 100);
  const count = memberIds.length;
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  return memberIds.map((uid, index) => {
    const shareCents = baseCents + (index < remainder ? 1 : 0);
    return {
      userId: uid,
      amount: shareCents / 100,
    };
  });
}

function calculateBalances({ members, expenses, settlements }) {
  const balancesMap = new Map();
  for (const m of members) {
    balancesMap.set(m.userId, {
      userId: m.userId,
      name: m.name,
      totalPaid: 0,
      totalShare: 0,
      settlementsSent: 0,
      settlementsReceived: 0,
    });
  }

  let totalHouseholdSpend = 0;

  for (const exp of expenses) {
    totalHouseholdSpend += exp.amount;
    const payer = balancesMap.get(exp.paidById);
    if (payer) {
      payer.totalPaid += exp.amount;
    }
    for (const split of exp.splits) {
      const splitUser = balancesMap.get(split.userId);
      if (splitUser) {
        splitUser.totalShare += split.amount;
      }
    }
  }

  for (const s of settlements) {
    const sender = balancesMap.get(s.fromUserId);
    if (sender) {
      sender.settlementsSent += s.amount;
    }
    const receiver = balancesMap.get(s.toUserId);
    if (receiver) {
      receiver.settlementsReceived += s.amount;
    }
  }

  const memberBalances = [];
  for (const [userId, data] of balancesMap.entries()) {
    const netBalance = Math.round(
      ((data.totalPaid - data.totalShare) + (data.settlementsSent - data.settlementsReceived)) * 100
    ) / 100;

    memberBalances.push({
      userId,
      name: data.name,
      totalPaid: Math.round(data.totalPaid * 100) / 100,
      totalShare: Math.round(data.totalShare * 100) / 100,
      settlementsSent: Math.round(data.settlementsSent * 100) / 100,
      settlementsReceived: Math.round(data.settlementsReceived * 100) / 100,
      netBalance,
    });
  }

  const debtors = memberBalances
    .filter((m) => m.netBalance < -0.01)
    .map((m) => ({ ...m, remaining: Math.abs(m.netBalance) }));

  const creditors = memberBalances
    .filter((m) => m.netBalance > 0.01)
    .map((m) => ({ ...m, remaining: m.netBalance }));

  const suggestedRepayments = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.remaining, creditor.remaining);
    if (settleAmount >= 0.01) {
      suggestedRepayments.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100,
      });

      debtor.remaining = Math.round((debtor.remaining - settleAmount) * 100) / 100;
      creditor.remaining = Math.round((creditor.remaining - settleAmount) * 100) / 100;
    }

    if (debtor.remaining < 0.01) dIdx++;
    if (creditor.remaining < 0.01) cIdx++;
  }

  return {
    totalHouseholdSpend: Math.round(totalHouseholdSpend * 100) / 100,
    memberBalances,
    suggestedRepayments,
  };
}

test("Equal split handles odd amounts without losing pennies", () => {
  const splits = calculateSplits("100.00", ["u1", "u2", "u3"]);
  assert.equal(splits.length, 3);
  assert.equal(splits[0].amount, 33.34);
  assert.equal(splits[1].amount, 33.33);
  assert.equal(splits[2].amount, 33.33);

  const total = splits.reduce((acc, s) => acc + s.amount, 0);
  assert.equal(Math.round(total * 100) / 100, 100.00);
});

test("Two-member expense and settlement calculates correctly", () => {
  const members = [
    { userId: "u1", name: "Alice" },
    { userId: "u2", name: "Bob" },
  ];

  const expenses = [
    {
      paidById: "u1",
      amount: 100,
      splits: [
        { userId: "u1", amount: 50 },
        { userId: "u2", amount: 50 },
      ],
    },
  ];

  const initial = calculateBalances({ members, expenses, settlements: [] });
  const aliceInitial = initial.memberBalances.find((m) => m.userId === "u1");
  const bobInitial = initial.memberBalances.find((m) => m.userId === "u2");

  assert.equal(aliceInitial.netBalance, 50); // Alice is owed 50
  assert.equal(bobInitial.netBalance, -50); // Bob owes 50
  assert.deepEqual(initial.suggestedRepayments, [
    { fromUserId: "u2", toUserId: "u1", amount: 50 },
  ]);

  // Bob settles up 50 with Alice
  const settled = calculateBalances({
    members,
    expenses,
    settlements: [{ fromUserId: "u2", toUserId: "u1", amount: 50 }],
  });

  const aliceSettled = settled.memberBalances.find((m) => m.userId === "u1");
  const bobSettled = settled.memberBalances.find((m) => m.userId === "u2");

  assert.equal(aliceSettled.netBalance, 0);
  assert.equal(bobSettled.netBalance, 0);
  assert.equal(settled.suggestedRepayments.length, 0);
});

test("Three-member circular spend debt simplification", () => {
  const members = [
    { userId: "u1", name: "Alice" },
    { userId: "u2", name: "Bob" },
    { userId: "u3", name: "Charlie" },
  ];

  // Alice pays 300 split 3 ways (100 ea)
  // Bob pays 150 split 3 ways (50 ea)
  // Charlie pays 0
  const expenses = [
    {
      paidById: "u1",
      amount: 300,
      splits: [
        { userId: "u1", amount: 100 },
        { userId: "u2", amount: 100 },
        { userId: "u3", amount: 100 },
      ],
    },
    {
      paidById: "u2",
      amount: 150,
      splits: [
        { userId: "u1", amount: 50 },
        { userId: "u2", amount: 50 },
        { userId: "u3", amount: 50 },
      ],
    },
  ];

  const result = calculateBalances({ members, expenses, settlements: [] });
  const alice = result.memberBalances.find((m) => m.userId === "u1");
  const bob = result.memberBalances.find((m) => m.userId === "u2");
  const charlie = result.memberBalances.find((m) => m.userId === "u3");

  assert.equal(alice.netBalance, 150); // 300 paid - 150 share = +150
  assert.equal(bob.netBalance, 0);     // 150 paid - 150 share = 0
  assert.equal(charlie.netBalance, -150); // 0 paid - 150 share = -150

  assert.deepEqual(result.suggestedRepayments, [
    { fromUserId: "u3", toUserId: "u1", amount: 150 },
  ]);
});
