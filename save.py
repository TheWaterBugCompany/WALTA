from mitmproxy.net.http.http1.assemble import assemble_request_head, assemble_response_head
import json

f = open('./output.txt', 'w')

def dumpJson(data):
    if data.headers['Content-Type'] == 'application/json':
            json_obj = json.loads(data.content)
            f.write(json.dumps(json_obj, indent=2))

def response(flow):

    f.write(assemble_request_head(flow.request).decode('utf-8', 'replace'))
    if flow.request.data.content:
        dumpJson(flow.request)
    f.write("\n\n")
    if flow.response.data.content:
        flow.response.decode()
        f.write(assemble_response_head(flow.response).decode('utf-8', 'replace'))
        dumpJson(flow.response)
        f.write("\n\n")
    
        
        