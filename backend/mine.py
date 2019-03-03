import random

# Class to 
class Minefield:
    def __init__(self, width, height):
        self.width  = width
        self.height = height
        self.field  = None

    # populate a minefield
    def populate(self, bombs):
        # Make empty map
        self.field = []
        for i in range(self.width):
            row = []
            for j in range(self.height):
                row.append(0)
            self.field.append(row)

        # Place bombs
        for i in range(bombs):
            x = random.randrange(self.width)
            y = random.randrange(self.height)

            self.field[x][y] = -1

            if ( x+1 < self.width and self.field[x+1][y] != -1 ):
                self.field[x+1][y] += 1
            if ( x-1 > 0 and self.field[x-1][y] != -1 ):
                self.field[x-1][y] += 1

            if ( y+1 < self.height and self.field[x][y+1] != -1 ):
                self.field[x][y+1] += 1
            if ( y-1 > 0 and self.field[x][y-1] != -1 ):
                self.field[x][y-1] += 1

            if ( x+1 < self.width and y+1 < self.height and self.field[x+1][y+1] != -1 ):
                self.field[x+1][y+1] += 1
            if ( x-1 < self.width and y-1 > self.height and self.field[x-1][y-1] != -1 ):
                self.field[x-1][y-1] += 1
            
            if ( x+1 < self.width and y-1 < self.height and self.field[x+1][y-1] != -1 ):
                self.field[x+1][y-1] += 1
            if ( x-1 < self.width and y-1 < self.height and self.field[x-1][y-1] != -1 ):
                self.field[x-1][y-1] += 1
            
            if ( x-1 < self.width and y+1 < self.height and self.field[x-1][y+1] != -1 ):
                self.field[x-1][y+1] += 1

        return self.field

