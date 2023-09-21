import json
def test_server(app, client):
    res = client.get('/ping')
    assert res.status_code == 200
    document = res.json
    assert document["topic"] == "test"
    assert document["status"] == "OK"
