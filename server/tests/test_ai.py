import json
def test_ai(app, client):
    res = client.get('/test/ai')
    assert res.status_code == 200
    result = json.loads(res.get_data(as_text=True))
    assert result["choices"][0]["finish_reason"] == "stop"
