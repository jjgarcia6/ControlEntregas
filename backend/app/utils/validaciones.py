from app.utils.exceptions import ValidacionNegocio


def _verificar_cedula(digitos: list[int]) -> bool:
    """Módulo 10 para los primeros 9 dígitos de cédula ecuatoriana."""
    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    total = 0
    for d, c in zip(digitos[:9], coeficientes):
        producto = d * c
        total += producto - 9 if producto >= 10 else producto
    digito_verificador = (10 - (total % 10)) % 10
    return digito_verificador == digitos[9]


def validar_identificacion(valor: str) -> dict[str, str]:
    """
    Valida cédula (10 dígitos) o RUC (13 dígitos) ecuatoriano.
    Retorna {"tipo": "cedula"|"ruc", "identificacion": valor} o lanza ValidacionNegocio.
    """
    if not valor.isdigit():
        raise ValidacionNegocio("La identificación debe contener solo dígitos")

    longitud = len(valor)
    if longitud not in (10, 13):
        raise ValidacionNegocio(
            f"Longitud inválida: se esperaban 10 o 13 dígitos, se recibieron {longitud}"
        )

    provincia = int(valor[:2])
    if not (1 <= provincia <= 24) and provincia != 30:
        raise ValidacionNegocio(f"Código de provincia inválido: {provincia}")

    digitos = [int(d) for d in valor]

    if not _verificar_cedula(digitos):
        raise ValidacionNegocio("Dígito verificador incorrecto")

    if longitud == 13:
        sufijo = valor[10:]
        if sufijo not in ("001", "002", "003", "004", "005", "006", "007", "008", "009"):
            raise ValidacionNegocio(f"Sufijo de RUC inválido: {sufijo}")
        return {"tipo": "ruc", "identificacion": valor}

    return {"tipo": "cedula", "identificacion": valor}
