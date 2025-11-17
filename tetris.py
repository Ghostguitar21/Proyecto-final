import sys #añade acceso y funciones a manipulacion de variables como objetos
import random #da acceso a funciones para generar o manipular variables aleatorias
import pygame #se importa la libreria de pygame utilizada para crear videojuegos

# Configuración de Pygame
pygame.init()
screen_width, screen_height = 400, 600 #ancho de la pantalla
screen = pygame.display.set_mode((screen_width, screen_height)) # Screen sin esto el juego falla, basicamente es la pantalla donde se visualiza el game
pygame.display.set_caption("Tetris") #nombre de la parte superior
# Colores
BLACK = (25, 0, 90) #fondo de tetris
WHITE = (255, 255, 255) # Lineas de la matriz del tetris
colors = [
    (0 ,0 , 0), # color de la matriz
    (0, 247, 255), # color de la LINEA
    (255, 239, 0), # color de cuadrado
    (255, 154, 0), # color de  la L
    (0, 70, 255), # color de la L invetida
    (171, 0, 255), # color de la T
    (0, 255, 50), # color del 5
    (255, 0, 0), # color de Z
]

# Configuración del Tetris
grid_size = 25 # Anchura de cada cuadrado
grid_width, grid_height = 10, 20 # LA MATRIZ  es 10*20
grid_top_left = (100, 50) # Pa que la matriz quede centrada
#1 bucle crea una lista de filas y 2 bucle crea una lista de ceros para cada fila,osea se se crea una matriz de ceros con height filas y width columnas
grid = [[0 for _ in range(grid_width)] for _ in range(grid_height)] 

# Crear formas de Tetriminos o tetris
tetriminos = [
    # Línea
    [[1, 1, 1, 1]],
    # Cuadrado
    [[1, 1],
     [1, 1]],
    # L
    [[1, 0, 0],
     [1, 1, 1]],
    # L invertida
    [[0, 0, 1],
     [1, 1, 1]],
    # T
    [[0, 1, 0],
     [1, 1, 1]],
    # 5
    [[0, 1, 1],
     [1, 1, 0]],
    # Z
    [[1, 1, 0],
     [0, 1, 1]],
]


class Tetrimino:
    def __init__(self, x, y, shape): #Constructo de la clase 
        self.x = x # self-  objeto actual creado , osea orientada a objetos para establecer valores iniciales
        self.y = y  # son valores que se pasan al constructor al crear un objeto en la class tetrimino o tetris
        self.shape = shape
        self.color = colors[tetriminos.index(shape) + 1] # el +1 se utiliza para evitar el índice 0 (se usa para el color de fondo)

    def move(self, dx, dy): #dx/dy - desplazamiento en la dirección horizontal/vertical (eje x) y self - objeto,mueve el objeto en la dirección especificada 
        self.x += dx #actualizar la posición horizontal del tetris
        self.y += dy #actualizar la posición vertical del tetris

    def rotate(self): # su función es girar la forma en sentido contrario a las agujas del reloj
        self.shape = list(zip(*reversed(self.shape))) # self shape- es rotar una forma geométrica almacenada en la variable


def draw_grid():
    for y in range(grid_height): #iteramos sobre y para representar la coordenada actual en y (la fila en la que está el bloque)
        for x in range(grid_width): #iteramos sobre x para representar la coordenada actual en x (la columna en la que está el bloque)
            rect = pygame.Rect(grid_top_left[0] + x * grid_size, grid_top_left[1] + y * grid_size, grid_size, grid_size) #rect calcula las coordenadas y el tamaño del bloque basado en sus coordenadas desde arriba a la izquierda (top left), el tamaño de la cuadricula (grid size) y sus coordenadas en x y y
            pygame.draw.rect(screen, colors[grid[y][x]], rect) #se usa para dar el color a cada bloque de la cuadricula 
            pygame.draw.rect(screen, WHITE, rect, 1)


def draw_tetrimino(tetrimino):
    for y, row in enumerate(tetrimino.shape):
        for x, cell in enumerate(row):
            if cell: #revisa si hay un bloque ocupado en la celda
                rect = pygame.Rect(grid_top_left[0] + (tetrimino.x + x) * grid_size,
                                   grid_top_left[1] + (tetrimino.y + y) * grid_size, grid_size, grid_size) #si la celda está ocupada por un bloque (tetrimino) se dibuja el bloque en esta celda
                pygame.draw.rect(screen, tetrimino.color, rect)
                pygame.draw.rect(screen, WHITE, rect, 1) #para mantener el color del borde de la cuadrícula aún cuando un bloque ocupe esta celda


def collision(tetrimino, dx=0, dy=0): #para que exista la colision de un tetrimino sea con el borde de la cuadrícula u otro tetrimino
    for y, row in enumerate(tetrimino.shape): 
        for x, cell in enumerate(row):
            if cell:
                new_x = tetrimino.x + x + dx #movimiento a seguir en x (columnas)
                new_y = tetrimino.y + y + dy #movimiento a seguir en y (filas)
                if new_x < 0 or new_x >= grid_width or new_y >= grid_height or grid[new_y][new_x]: #revisa si el movimiento a realizar resulta en una colisión, sea al sobreponerse con otro tetrimino o salir de la cuadrícula
                    return True #si hay colisión
    return False #no hay colisión


def clear_lines(): #para llevar en cuenta el numero de lineas completadas y saber cuando eliminar una linea completada
    global grid
    new_grid = []
    lines_cleared = 0 #lleva la cuenta de filas completadas, que al empezar es 0
    for row in grid:
        if not all(cell != 0 for cell in row): #revisa si una linea está completada viendo sus valores, si todos son 0 está vacía, si todos son 1, está completa
            new_grid.append(row) 
        else:
            lines_cleared += 1 #aumenta el conteo
    while len(new_grid) < grid_height: 
        new_grid.insert(0, [0 for _ in range(grid_width)]) #se elimina la linea completada sin alterar la cuadricula y mueve el resto de filas
    grid = new_grid
    return lines_cleared


def new_tetrimino():
    shape = random.choice(tetriminos) #elige una figura al azar dentro de la lista de tetriminos
    x = grid_width // 2 - len(shape[0]) // 2 #hace que el tetrimino elegido caiga desde el centro
    return Tetrimino(x, 0, shape) 


def lock_tetrimino(tetrimino): #Bloquea el tetrimino en su posicion actual
    for y, row in enumerate(tetrimino.shape): 
        for x, cell in enumerate(row): #Iteramos sobre la lista 'row' usando enumerate
            if cell:
                grid[tetrimino.y + y][tetrimino.x + x] = colors.index(tetrimino.color) #Almacena informacion sobre las piezas del Tetris


def main():
    clock = pygame.time.Clock()  #Agrega los paréntesis al constructor
    fall_time = 0 #Controla la velocidad de caida de las piezas
    fall_speed = 500 #Velocidad de caida inicial en segundos
    tetrimino = new_tetrimino() #Crea una nueva pieza para agregar al juego
    score = 0  # Inicializa el puntaje
    font = pygame.font.Font(None, 36)  # Crea una fuente para mostrar el puntaje
    while True:
        fall_time += clock.tick(30)  # Ajusta la velocidad de fotogramas
        for event in pygame.event.get():  # Agrega los paréntesis
            if event.type == pygame.QUIT:  #Detecta si el usuario ha cerrado la ventana del juego
                pygame.quit() #Detiene el juego
                sys.exit() #Cierra el programa
            elif event.type == pygame.KEYDOWN:  #Captura el momento en que se presiona una tecla
                if event.key == pygame.K_LEFT:  #Detecta si la tecla izquierda ha sido presionada
                    if not collision(tetrimino, dx=-1):  #Verifica si no hay colision entre el tetrimino y la pared
                        tetrimino.move(-1, 0) #Mueve la pieza una posicion hacia arriba en el tablero
                elif event.key == pygame.K_RIGHT: #Detecta si la tecla derecha ha sido presionada
                    if not collision(tetrimino, dx=1): # Si no hay colisión al mover el tetrimino hacia la derecha
                        tetrimino.move(1, 0)  # Corrige el nombre de la función
                elif event.key == pygame.K_UP: #Detecta si la tecla de flecha hacia arriba ha sido presionada
                    tetrimino.rotate() #Rota la pieza actual
                    if collision(tetrimino):  #Detecta colisiones entre el tetrimino actual y otros elementos del juego
                        tetrimino.rotate()  # Simplifica la lógica de la rotación
        if fall_time >= fall_speed:  #Determina si es hora de mover la pieza hacia abajo
            if not collision(tetrimino, dy=1):  #Evalúa si no hay colisión entre el tetriminoy la posicion desplazada
                tetrimino.move(0, 1) #Mover la pieza hacia la derecha
            else:
                lock_tetrimino(tetrimino) #Fija la posicion del tetrimino en el tablero
                lines_cleared = clear_lines()
                score += lines_cleared * 1000  # Aumenta el puntaje según las líneas eliminadas
                tetrimino = new_tetrimino() #Crea una nueva pieza de tetrominós
                if collision(tetrimino):
                    pygame.quit() #Detiene el juego
                    sys.exit() #Cierra el programa
            fall_time = 0 #Controla la velocidad de caida de las piezas
        screen.fill(BLACK) #Llena la pantalla con el color negro
        draw_grid() #Dibuja una cuadrícula en la pantalla del juego
        draw_tetrimino(tetrimino) #
        # Muestra el puntaje en la pantalla
        score_text = font.render("Score: " + str(score), True, WHITE) #Renderiza el texto del puntaje en la pantalla
        screen.blit(score_text, (50, 20)) #Muestra el puntaje en las posiciones dadas
        pygame.display.flip() #Actualiza el contenido de toda la pantalla


if __name__ == "__main__": #Sin esto no funciona
    main()
