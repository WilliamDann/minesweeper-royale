import random

# Class to store a tile
class Tile:
    def __init__(self, number, color="#fff", cleared=False):
        self.number  = number
        self.color   = color
        self.cleared = cleared
    
    # Override __str__ for printing the number
    def __str__(self):
        return str(self.number)

# Class to store a minefield
class Minefield:
    def __init__(self, width, height):
        self.width  = width
        self.height = height
        self.field  = None

    # Get the index of the surrounding tiles
    def getSurrounding(self, x, y):
        points = [
            (x+1, y),
            (x-1, y),
            (x, y+1),
            (x, y-1),
            (x+1, y+1),
            (x-1, y+1),
            (x-1, y-1),
            (x+1, y-1)
        ]
        fin = []

        for i in points:
            if (i[0] < self.width and i[0] >= 0) and (i[1] < self.height and i[1] >= 0):
                fin.append(i)
        
        return fin

    # populate a minefield
    def populate(self, bombs):
        # Make empty map
        self.field = []
        for i in range(self.width):
            row = []
            for j in range(self.height):
                obj = Tile(0)
                row.append(obj)
            self.field.append(row)

        # Place bombs
        for i in range(bombs):
            x = random.randrange(self.width)
            y = random.randrange(self.height)

            self.field[x][y].number = -1

            if ( x+1 < self.width and self.field[x+1][y].number != -1 ):
                self.field[x+1][y].number += 1
            if ( x-1 > 0 and self.field[x-1][y].number != -1 ):
                self.field[x-1][y].number += 1

            if ( y+1 < self.height and self.field[x][y+1].number != -1 ):
                self.field[x][y+1].number += 1
            if ( y-1 > 0 and self.field[x][y-1].number != -1 ):
                self.field[x][y-1].number += 1

            if ( x+1 < self.width and y+1 < self.height and self.field[x+1][y+1].number != -1 ):
                self.field[x+1][y+1].number += 1
            if ( x-1 < self.width and y-1 > self.height and self.field[x-1][y-1].number != -1 ):
                self.field[x-1][y-1].number += 1
            
            if ( x+1 < self.width and y-1 < self.height and self.field[x+1][y-1].number != -1 ):
                self.field[x+1][y-1].number += 1
            if ( x-1 < self.width and y-1 < self.height and self.field[x-1][y-1].number != -1 ):
                self.field[x-1][y-1].number += 1
            
            if ( x-1 < self.width and y+1 < self.height and self.field[x-1][y+1].number != -1 ):
                self.field[x-1][y+1].number += 1

        return self.field

    # click a point
    def click(self, x, y):
        arr = []
        def recurse(x, y):
            arr.append((x,y))
            self.field[x][y].cleared = True
            
            if self.field[x][y].number == 0:
                points = self.getSurrounding(x, y)
                for point in points:
                    if (self.field[point[0]][point[1]].cleared == False):
                        recurse(point[0], point[1])
        
        recurse(x, y)
        return arr