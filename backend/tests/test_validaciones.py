import pytest

from app.utils.exceptions import ValidacionNegocio
from app.utils.validaciones import validar_identificacion


def test_should_validate_valid_cedula() -> None:
    result = validar_identificacion("1713175071")
    assert result["tipo"] == "cedula"
    assert result["identificacion"] == "1713175071"


def test_should_validate_valid_ruc() -> None:
    result = validar_identificacion("1713175071001")
    assert result["tipo"] == "ruc"
    assert result["identificacion"] == "1713175071001"


def test_should_reject_invalid_digito_verificador() -> None:
    with pytest.raises(ValidacionNegocio, match="Dígito verificador"):
        validar_identificacion("1713175079")


def test_should_reject_wrong_length() -> None:
    with pytest.raises(ValidacionNegocio, match="Longitud inválida"):
        validar_identificacion("12345")


def test_should_reject_non_digit_characters() -> None:
    with pytest.raises(ValidacionNegocio, match="solo dígitos"):
        validar_identificacion("171234AB78")
