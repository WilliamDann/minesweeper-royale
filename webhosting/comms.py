import asyncio
import websockets
import json
import random
import player
from player import playerObj


#TODO:Catch any errors, print the message

playerDict = {}



class Comms:

    def __init__(self):
        self.data = {}
        asyncio.get_event_loop().run_until_complete(
        websockets.serve(handleMsg, 'localhost', 5000))
        asyncio.get_event_loop().run_forever()

    
    async def handleMsg(self,websocket,path):
        async for message in websocket:
            response = self.commandHandler(message,websocket)


   
    def findplayer(self,websocket):
        global playerDict
        if(websocket in playerDict.keys()):
            return playerDict[websocket]
        else:
            Tempobj = playerObj(websocket)
            playerDict[websocket] = Tempobj
            return playerDict[websocket]
    
    
    def verifyName(self,name):
        for socket,player in playerDict:
            if(player.name == name):
                return False
        return True
    

    #Calls the relevant method and decode json
    def commandHandler(self, msg, websocket):
        self.data = json.load(msg)
        currPlayer = self.findplayer(websocket)
        currAction = self.data['action']

        if(currAction == 'ready'):
            self.verifyName(self.data['username']) #TODO: Respond with invalid name 
            currPlayer.ready = True
        elif(currAction == 'click'):
            currPlayer.lastClick = [self.data['x'],self.data['y']]
            #TODO: implement click event

    
        



    
       




#example socket app
async def echo(websocket, path):
    async for message in websocket:
        await websocket.send(message + " reply")
