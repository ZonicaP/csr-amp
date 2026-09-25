"use client";

import { createContext, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { AccountIssue, AccountSnapshot } from "@/lib/debug/account-issue";

export type CustomerNavState = {
  name: string;
  membershipId: string;
  account: AccountSnapshot;
  issue: AccountIssue;
  maxDiscount: number | null;
};

const CustomerNavContext = createContext<{
  customer: CustomerNavState | null;
  setCustomer: Dispatch<SetStateAction<CustomerNavState | null>>;
}>({
  customer: null,
  setCustomer: () => {},
});

export function CustomerNavProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerNavState | null>(null);
  return <CustomerNavContext.Provider value={{ customer, setCustomer }}>{children}</CustomerNavContext.Provider>;
}

export function useCustomerNav() {
  return useContext(CustomerNavContext).customer;
}

export function PublishCustomerNav(customer: CustomerNavState) {
  const { setCustomer } = useContext(CustomerNavContext);
  const latest = useRef(customer);
  latest.current = customer;
  useEffect(() => {
    setCustomer((current) => {
      const next = latest.current;
      if (
        current &&
        current.name === next.name &&
        current.membershipId === next.membershipId &&
        current.maxDiscount === next.maxDiscount &&
        current.account === next.account &&
        current.issue === next.issue
      ) {
        return current;
      }
      return next;
    });
  });
  useEffect(() => () => setCustomer(null), [setCustomer]);
  return null;
}
