import os
import json
import datetime

class DocDB_File:
    def __init__(self, base_path):
        self.base_path = base_path

    def create_folder(self, folder_name):
        folder_path = os.path.join(self.base_path, folder_name)
        os.makedirs(folder_path, exist_ok=True)

    def list_folders(self):
        return os.listdir(self.base_path)

    def list_documents(self, folder_name):
        folder_path = os.path.join(self.base_path, folder_name)
        print("list_documents: folder_path = ", folder_path)
        documents = []
        result = {}
        file_count = 0
        error_count = 0
        for file_name in os.listdir(folder_path):
            if file_name.endswith('.json'):
                file_path = os.path.join(folder_path, file_name)
                try:
                    with open(file_path, 'r') as f:
                        document = json.load(f)
                        documents.append({
                            'id': document['metadata']['id'],
                            'name': document['metadata']['name'],
                            'tags': document['metadata']['tags'],
                        })
                    file_count += 1
                except Exception as e:
                    error_count += 1
                    print("Error reading file: ", file_path)
                    print(e)
        result['file_count'] = file_count
        result['error_count'] = error_count
        if error_count > 0:
            result['status'] = 'ERROR'
            result['message'] = 'Some files could not be read'
        else:
            result['status'] = 'OK'
            result['message'] = 'All files read successfully'
        result['documents'] = documents
        return result
    
    def new_id(self):
        now = datetime.datetime.now()
        id = now.strftime("%y%m%d%H%M%S%f")
        return id

    def create_document(self, folder_name, name, tags, content):
        folder_path = os.path.join(self.base_path, folder_name)
        print("create_document: folder_path = ", folder_path)
        if folder_name != "" and folder_name not in self.list_folders():
            os.makedirs(folder_path, exist_ok=True)
        id = self.new_id()
        created_date = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        updated_date = created_date
        if name == "":
            name = "New Note"
        metadata = {
            'id': id,
            'name': name,
            'created_date': created_date,
            'updated_date': updated_date,
            'tags': tags
        }
        document = {
            'metadata': metadata,
            'content': content
        }
        file_name = f'{id}.json'
        file_path = os.path.join(folder_path, file_name)
        with open(file_path, 'w') as f:
            json.dump(document, f)
        return self.load_document(folder_name, id)

    def load_document(self, folder_name, id):
        folder_path = os.path.join(self.base_path, folder_name)
        file_name = f'{id}.json'
        file_path = os.path.join(folder_path, file_name)
        try:
            with open(file_path, 'r') as f:
                document = json.load(f)
        except Exception as e:
            raise ValueError(f"No document found with id {id}")
        return document        

    def save_document(self, folder_name, id, name, tags, content):
        folder_path = os.path.join(self.base_path, folder_name)
        file_name = f'{id}.json'
        file_path = os.path.join(folder_path, file_name)
        with open(file_path, 'r') as f:
            document = json.load(f)
        updated_date = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        document['metadata']['name'] = name
        document['metadata']['tags'] = tags
        document['content'] = content
        document['metadata']['updated_date'] = updated_date
        with open(file_path, 'w') as f:
            json.dump(document, f)
        return document
    
    def delete_document(self, folder_name, id):
        folder_path = os.path.join(self.base_path, folder_name)
        file_name = f'{id}.json'
        file_path = os.path.join(folder_path, file_name)
        os.remove(file_path)
        return True
    
    def search_documents(self, folder_name, keyword):
        folder_path = os.path.join(self.base_path, folder_name)
        documents = []
        for file_name in os.listdir(folder_path):
            if file_name.endswith('.json'):
                file_path = os.path.join(folder_path, file_name)
                with open(file_path, 'r') as f:
                    document = json.load(f)
                    if keyword in document['content'] or \
                        keyword in document['metadata']['tags'] or \
                        keyword in document['metadata']['name']:
                        documents.append({
                            'id': document['metadata']['id'],
                            'name': document['metadata']['name'],
                            'tags': document['metadata']['tags'],
                        })
        return documents
    
    def rename_folder(self, folder_name, new_folder_name):
        folder_path = os.path.join(self.base_path, folder_name)
        new_folder_path = os.path.join(self.base_path, new_folder_name)
        os.rename(folder_path, new_folder_path)
        return True
    
    def delete_folder(self, folder_name):
        folder_path = os.path.join(self.base_path, folder_name)
        for file_name in os.listdir(folder_path):
            file_path = os.path.join(folder_path, file_name)
            os.remove(file_path)
        os.rmdir(folder_path)
        return True
    
    def rename_document(self, folder_name, id, new_doc_name):
        folder_path = os.path.join(self.base_path, folder_name)
        file_name = f'{id}.json'
        file_path = os.path.join(folder_path, file_name)
        with open(file_path, 'r') as f:
            document = json.load(f)
        document['metadata']['name'] = new_doc_name
        with open(file_path, 'w') as f:
            json.dump(document, f)
        return True