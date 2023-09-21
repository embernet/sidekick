import json
def test_config(app, client):
    res = client.get('/test/config')
    assert res.status_code == 200
    result = json.loads(res.get_data(as_text=True))
    assert "docdb_dir" in result
    assert "settings_dir" in result
    assert "logs_dir" in result
    assert "openai_api_key_env_var" in result
    assert "port" in result
    assert "docker" in result["port"]
    assert "development" in result["port"]
