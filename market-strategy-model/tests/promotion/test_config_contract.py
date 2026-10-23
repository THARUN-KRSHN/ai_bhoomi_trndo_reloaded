from app.config import Settings


def test_execution_layer_environment_contract():
    settings = Settings(
        openai_model="legacy-model",
        openai_text_model="text-model",
        upi_merchant_vpa="shop@example",
        upi_payee_name="Demo Shop",
        promotion_storage_dir="./storage/promotions",
        max_upload_mb=10,
    )
    assert settings.openai_text_model_effective == "text-model"
    assert settings.effective_upi_vpa == "shop@example"
    assert settings.effective_upi_payee_name == "Demo Shop"
    assert settings.effective_max_upload_bytes == 10 * 1024 * 1024
