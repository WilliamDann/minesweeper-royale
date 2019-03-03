import asyncio
import websockets
import json


#TODO:Catch any errors, print the message




class Comms:

    def __init__(self):
        self.data = {}

    #Calls the relevant method and decode json
    def commandHandler(self, msg):
       self.data = json.load(msg)

       currAction = data['action']
       if(currAction == 'ready'):
           
    

        


#example socket app
async def echo(websocket, path):
    async for message in websocket:
        await websocket.send(message + " reply")

    




asyncio.get_event_loop().run_until_complete(
    websockets.serve(echo, 'localhost', 5000))
asyncio.get_event_loop().run_forever()
