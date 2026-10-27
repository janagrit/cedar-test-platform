"""Example contract test. Replace the sample payload with a real service response.

A contract test checks the shape a consumer depends on: required fields, types,
and that backward-compatible fields are still present. It needs no running service.
"""
import pytest

# The agreed contract for a sample "payment status" response (version 1).
CONTRACT_V1 = {
    "id": str,
    "status": str,        # one of: pending, succeeded, failed
    "amount_cents": int,
    "currency": str,
}
ALLOWED_STATUS = {"pending", "succeeded", "failed"}


def sample_response() -> dict:
    # Stand-in for a recorded or live response from the service under test.
    return {"id": "pay_123", "status": "succeeded", "amount_cents": 2500, "currency": "USD"}


def check_contract(payload: dict, contract: dict) -> list[str]:
    errors = []
    for field, expected_type in contract.items():
        if field not in payload:
            errors.append(f"missing field: {field}")
        elif not isinstance(payload[field], expected_type):
            errors.append(f"wrong type for {field}: {type(payload[field]).__name__}")
    return errors


def test_response_matches_contract_v1():
    assert check_contract(sample_response(), CONTRACT_V1) == []


def test_status_is_a_known_value():
    assert sample_response()["status"] in ALLOWED_STATUS


@pytest.mark.parametrize("missing", list(CONTRACT_V1))
def test_checker_detects_missing_field(missing):
    payload = sample_response()
    del payload[missing]
    assert check_contract(payload, CONTRACT_V1) == [f"missing field: {missing}"]
