from mine import *

t = Minefield(20, 20)
t.populate(50)

for x in t.field:
    for i in range(len(x)):
        end = " "

        if (i+1 < len(x) and x[i+1] == -1):
            end = ""

        print(x[i], end=end)
    print()