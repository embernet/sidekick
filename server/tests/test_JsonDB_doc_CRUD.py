import json
import logging

def test_JsonDB_doc_CRUD(app, client):
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    logger.addHandler(handler)

    TEST_NAME = 'Test Document'
    TEST_TAGS = ['test', 'document']
    TEST_CONTENT = 'This is a test document'

    def test_schema(document):
        assert document['metadata']['name'] == TEST_NAME
        assert document['metadata']['tags'] == TEST_TAGS
        assert document['content'] == TEST_CONTENT
        assert document['metadata']['created_date'] is not None
        assert document['metadata']['updated_date'] is not None

    def test_CRUD(folder):
        # Create a test document
        data = {
            'name': TEST_NAME,
            'tags': TEST_TAGS,
            'content': TEST_CONTENT
        }
        url = f'/docdb/{folder}/documents'
        logger.debug('url:' + url)
        response = client.post(url, json=data)
        logger.debug(response)
        assert response.status_code == 200

        # Check that the document was created
        document = response.json
        logger.debug(document)
        assert document['metadata']['id'] is not None
        test_schema(document)

        # Get the test document
        id = document['metadata']['id']
        response = client.get(f'/docdb/{folder}/documents/{id}')
        assert response.status_code == 200
        document = response.json
        assert document['metadata']['id'] == id
        test_schema(document)

        # Update the test document
        document['content'] += ' that has been updated'
        response = client.put(f'/docdb/{folder}/documents/{id}', json=document)
        assert response.status_code == 200

        # Check that the document was updated
        response = client.get(f'/docdb/{folder}/documents/{id}')
        assert response.status_code == 200
        document = response.json
        assert document['content'] == 'This is a test document that has been updated'
        assert document['metadata']['id'] == id

        # Delete the test document
        response = client.delete(f'/docdb/{folder}/documents/{id}')
        assert response.status_code == 200

        # Check that the document was deleted
        response = client.get(f'/docdb/{folder}/documents/{id}')
        assert response.status_code == 404

    for folder in ['test_folder']:
        test_CRUD(folder)