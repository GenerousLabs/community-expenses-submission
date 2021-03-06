import React from "react";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import Button from "@material-ui/core/Button";

import { getUserId } from "../../services/auth/auth.service";
import { Link } from "react-router-dom";

type ReceiptReturn = {
  id: string;
  number: number;
  amount_cents: number;
  paper_copy_received: boolean;
  has_been_paid: boolean;
};

const ReceiptIndexQuery = gql`
  query ReceiptIndexQuery($user_id: String!) {
    receipts(where: { user_id: { _eq: $user_id } }) {
      id
      number
      amount_cents
      paper_copy_received
      has_been_paid
    }
  }
`;

const ReceiptIndex = () => {
  const { loading, error, data } = useQuery(ReceiptIndexQuery, {
    fetchPolicy: "cache-and-network",
    variables: {
      user_id: getUserId()
    }
  });

  if (error) {
    return (
      <div>
        <p>Error #iY20Jq: {error.message}</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  const unsortedReceipts: ReceiptReturn[] = data.receipts;
  const receipts = unsortedReceipts
    .concat([])
    .sort((r1, r2) => r1.number - r2.number);

  return (
    <div>
      <h2>Receipts</h2>
      <ul>
        {receipts.map((receipt: ReceiptReturn) => {
          return (
            <li key={receipt.id}>
              <Link to={`/receipts/${receipt.id}`}>
                Number: {receipt.number};
              </Link>{" "}
              Amount: €{(receipt.amount_cents / 100).toFixed(2)}; Paper
              received: {receipt.paper_copy_received ? "Yes" : "No"}; Payment
              status: {receipt.has_been_paid ? "Sent" : "Pending"}
            </li>
          );
        })}
      </ul>
      <h2>New Receipt</h2>
      <Link to="/receipts/new">
        <Button variant="contained">Submit new receipt</Button>
      </Link>
    </div>
  );
};

export default ReceiptIndex;
