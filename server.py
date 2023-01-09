#!/usr/bin/env python3

import websockets
import asyncio
from concurrent.futures import ThreadPoolExecutor
import json
import os
import subprocess
import sys
import ssl

# Server data
HOST = "0.0.0.0"
PORT = 49001

input_queues = {}

def main():
    print("Server listening on Port " + str(PORT))
    # Start the server
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain("cert.pem", "cert.pem")
    start_server = websockets.serve(handle_request, HOST, PORT, max_size=9000000, ssl=ssl_context)
    # start_server = websockets.serve(handle_request, HOST, PORT)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()

# The main behavior function for this server
async def handle_request(websocket, path):
    print("A browser just connected")
    # Handle incoming messages
    try:
        async for message_json in websocket:
            message = json.loads(message_json)
            print(f'Received message from browser: {message}')
            executor = ThreadPoolExecutor(1)
            # executor.submit(lambda: communicate(websocket, message['web_id'], message['command'], message['data']))
            asyncio.create_task(communicate(websocket, message['web_id'], message['command'], message['data']))

    # Handle disconnecting clients
    except websockets.exceptions.ConnectionClosed as e:
        print("A client just disconnected")
    finally:
        pass

async def communicate(conn, web_id, command, data):
    global input_queues
    if command == 'run':
        await conn.send(f'received program from {web_id} to run')
        q = asyncio.Queue()
        input_queues[web_id] = q
        await run_program(conn, web_id, data, q)
        input_queues.pop(web_id)
    elif command == 'input':
        print(f"got input: {data}")
        await input_queues[web_id].put(data)

async def run_program(conn, web_id, prog_text, q):
    DOCKER_FILE = 'dockerfile'
    DOCKER_CONTAINER_NAME = 'python-example'
    DOCKER_PROG_PATH = f'/home/python-user/{web_id}.py'

    # copy program into docker container at DOCKER_PROG_PATH
    prog_name = f'/tmp/{web_id}.py'
    with open(prog_name, 'w') as f:
        f.write(prog_text)
        f.write('\n')

    subprocess.run(['docker', 'cp', prog_name, f'{DOCKER_CONTAINER_NAME}:{DOCKER_PROG_PATH}'])
    docker_run = subprocess.Popen(['docker', 'exec', '-i', DOCKER_CONTAINER_NAME,
        'python3', DOCKER_PROG_PATH], stdout=subprocess.PIPE,
                                      stdin=subprocess.PIPE,
                                      stderr=subprocess.PIPE)
    os.set_blocking(docker_run.stdout.fileno(), False)
    os.set_blocking(docker_run.stderr.fileno(), False)
    while True:
        text = docker_run.stdout.read()
        if text is not None:
            print(f'{text.decode()}', end='')
            await conn.send(f'{text.decode()}')

        error_text = docker_run.stderr.read()
        if error_text is not None:
            print(f'{error_text.decode()}', end='')
            await conn.send(f'{error_text.decode()}')

        if docker_run.poll() is not None:
            # remove program from docker
            subprocess.run(['docker', 'exec', DOCKER_CONTAINER_NAME, 'rm', '-f', DOCKER_PROG_PATH])
            break
        await asyncio.sleep(0.1)
        while not q.empty():
            print('reading data')
            input_data = await q.get()
            docker_run.stdin.write(f'{input_data}\n'.encode())
            docker_run.stdin.flush()
            print(f'input: {input_data}')

if __name__ == "__main__":
    main()
