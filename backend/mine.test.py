from mine import *

t = Minefield(20, 20)
t.populate(50)
ret = t.click(10, 10)
print("\n"*3)
print(ret)

# for x in t.field:
#     for y in x:
#         print(y.cleared, end = " ")
#     print()